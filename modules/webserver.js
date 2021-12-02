
import express from 'express';
import http from 'http';
import https from 'https';
import fs, { stat } from 'fs';
import session from 'express-session'
var globStateMachine;
var globDb;
var stateMachines = {}
export default class covcheckWebserver {
    constructor() {
        this.app = express();
        this.app.use(session({
            secret: "asodfjsadf",
            path: "/"
        }))


    }
    stateMachineSession(req, res, next) {
        // create new state machine for session
        if (stateMachines[req.session.id] == undefined) {

            console.log("Initializing State Machine" + req.session.id)
            stateMachines[req.session.id] = new globStateMachine();
            stateMachines[req.session.id].registerDbController(globDb)
            stateMachines[req.session.id].requiredStatesFromEvent(this.event)
            stateMachines[req.session.id].registerOutputModule(this.outputModule)
            req.session.save();
        } 
        next();
    }
    async registerAPI() {
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use((req, res, next) => {
            this.stateMachineSession(req, res, next)
        }
        );
        this.app.post("/api/check/dcc", async (req, res) => {
            let response = {};
            if (req.body.base45 != undefined) {
                try {


                    let dcc = await this.dccVerifier.getDccAndCheckValidity(req.body.base45);
                    dcc.validNoCovid = false;
                    // valid X.509 cert, now check covid rules

                    if (dcc.dcc.valid) {
                        dcc.rules = await this.dccVerifier.checkRules(dcc.dcc.payload)
                        if (dcc.rules[0]["errors"] === 0 && dcc.dcc.valid) {
                            dcc.validNoCovid = true;
                            console.log("Valid Rules, No Covid!")
                            let person = {
                                "fn": dcc.dcc.payload.nam.fnt,
                                "gn": dcc.dcc.payload.nam.gnt,
                                "dob": dcc.dcc.payload.dob 
                            }
                            if (stateMachines[req.session.id].person.fn != null) {
                                if (stateMachines[req.session.id].person.gn == person.gn && 
                                    stateMachines[req.session.id].person.dob == person.dob) {
                                    stateMachines[req.session.id].person 
                                    console.log("Entering into stateMachine")
                                    stateMachines[req.session.id].enterState(dcc.dcc.type, true);
                                    response = JSON.stringify(dcc);
                                } else {
                                    // Person mismatch
                                    response = {"error": "name_mismatch"}
                                }
                            } else {
                                console.log("Entering into stateMachine")
                                    stateMachines[req.session.id].enterState(dcc.dcc.type, true);
                                    response = JSON.stringify(dcc);
                            }
                            
                        } else {
                            stateMachines[req.session.id].enterState(dcc.dcc.type, false);
                        }
                    } else {
                        stateMachines[req.session.id].enterState(dcc.dcc.type, false);
                    }
                    stateMachines[req.session.id].lastInput = {"type": "dcc", dcc: dcc}
                    
                } catch (e) {
                    console.log(e);
                    response = { "error": "Invalid QR" }
                }
            }
            res.send(response);
            res.end();
        });
        this.app.post("/api/createEvent", async (req, res) => {
            if (req.body.eventIsActive)
                await this.db.event.update({"eventIsActive": false}, {where: {"eventIsActive": true}});
            let newEvent = await this.db.event.create(req.body);
            if (req.body.eventIsActive) {
                this.registerEvent(newEvent.dataValues);
                for (var i in stateMachines) {
                    stateMachines[i].requiredStatesFromEvent(newEvent.dataValues)
                }
            }
            res.type("json")
            res.status(200).send(JSON.stringify(newEvent.dataValues));
            res.end();
        });
        this.app.get("/api/eventList", async (req, res) => {
            if (req.query.cursor == undefined) {
                req.query.cursor = 0;
            }
            if (req.query.limit == undefined) {
                req.query.limit = 10;
            }
            let {totalCount, rows} = await this.db.event.findAndCountAll({
                where: {},
                limit: req.query.limit,
                offset: req.query.cursor,
                order: [["id", "DESC"]]
            });
            let response = {
                data: rows,
                nextCursor: parseInt(req.query.cursor) + parseInt(req.query.limit),
                limit: req.query.limit,
                totalCount: totalCount
            }
            res.type("json")
            res.send(JSON.stringify(response, null, 2))
            res.end();
        });
        this.app.post("/api/deleteEvent", async (req, res) => {
            if (req.body.id == undefined) {
                res.status(400);
                res.end();
                return;
            };
            let event = await this.db.event.findByPk(req.body.id);
            if (!(event instanceof this.db.event)) {
                res.status(400);
                res.end();
            }
            await event.destroy();
        }),
        this.app.post("/api/modifyEvent", async (req, res) => {

        })
        this.app.get("/api/participantList", async (req, res) => {
            let event = await this.db.event.findByPk(req.query.id);
            let participants = await event.getParticipants();
            res.type("json")
            res.send(JSON.stringify({
                event: event,
                participants: participants
            }, null, 2));
            res.end();
        })
        this.app.get("/api/status", async (req, res) => {


            res.send(JSON.stringify(await this.generateStatus(req.session.id)));
            res.end();

        })
    }
    async generateStatus(stateMachineIndex) {
        let status = {
            stateMachine: {
                requiredStates: stateMachines[stateMachineIndex].requiredStates,
                states: stateMachines[stateMachineIndex].states,
                finished: stateMachines[stateMachineIndex].checkState(),
                acceptance: stateMachines[stateMachineIndex].rewrites,
                lastInput: stateMachines[stateMachineIndex].lastInput,
                hold: stateMachines[stateMachineIndex].hold
            },
            event: this.event,
            config: global.config.stateMachineConfig,
            debug: global.config.debug
        };
        //console.log(status)
        return status;
    }
    async serveStatic() {
        this.app.use('/', express.static('modules/webserver/static'));
        this.app.use('/scripts/bootstrap', express.static('node_modules/bootstrap/dist/'));
        this.app.use('/scripts/qr-scanner', express.static('node_modules/qr-scanner/'));
        this.app.use('/scripts/jquery', express.static('node_modules/jquery/dist/'));

    }
    registerDccVerifier(verifier) {
        this.dccVerifier = verifier;
    }
    registerStateMachine(stateMachine) {
        this.stateMachine = stateMachine;
        globStateMachine = stateMachine
    }
    registerDbController(db) {
        this.db = db;
        globDb = db;
    }
    registerEvent(event) {
        this.event = event;
    }
    registerOutputModule(output) {
        this.outputModule = output;
    }
    async listen() {
        if (global.config.webserverHttpsPort != undefined) {
            let privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
            let certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
            let credentials = { key: privateKey, cert: certificate };
            this.httpsServer = https.createServer(credentials, this.app);
            this.httpsServer.listen(global.config.webserverHttpsPort);

        }


        this.httpServer = http.createServer(this.app);
        this.httpServer.listen(global.config.webserverPort);


    }
}
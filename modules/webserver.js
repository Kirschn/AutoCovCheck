
import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
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
                            stateMachines[req.session.id].enterState(dcc.dcc.type, true)
                        }
                    }
                    stateMachines[req.session.id].lastInput = {"type": "dcc", dcc: dcc}
                    response = JSON.stringify(dcc);
                } catch (e) {
                    console.log(e);
                    response = { "error": "Invalid QR" }
                }
            }
            res.send(response);
            res.end();
        });
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
            config: global.config.stateMachineConfig
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
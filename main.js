import fs from 'fs';
global.config = JSON.parse(fs.readFileSync("config.json"));
global.rules = {};

import verifyCerts from './modules/verifyCerts.js'
import stateMachine from './modules/stateMachine.js'
import webserverModule from './modules/webserver.js'
import database from './modules/database.js'
import covcheckOutputModule from './modules/outputController.js';
import Jimp from 'jimp';
import jsQR from 'jsqr';

const verify = new verifyCerts();
const webserver = new webserverModule();
const eventDb = new database(global.config.database);
const outputController = new covcheckOutputModule();

async function boot() {
    //verify.check();
    
    await eventDb.loadModel()
    eventDb.event.create({
        eventName: "Testevent",
        entranceTypeName: "2G",
        entranceWithVac: true,
        entranceWithRecov: true,
        entranceWithRAT: false,
        entranceWithNAAT: false,
        entranceNeedsRAT: false,
        maxRATAge: 24,
        checkIdCard: false,
        logPersons: false
    })
    verify.loadRules(global.config.ruleCountry);
    verify.loadValueSets();

    webserver.registerDccVerifier(verify);
    webserver.registerStateMachine(stateMachine);
    webserver.registerDbController(eventDb)
    webserver.registerEvent(await eventDb.getRunningEvent())
    webserver.registerOutputModule(outputController)

    webserver.registerAPI();
    webserver.serveStatic();
    webserver.listen(global.config.webserverPort);

    /*const buffer = fs.readFileSync("/home/wolff/covcert.jpg");
    const image = await Jimp.read(buffer);
    const code = jsQR(image.bitmap.data, image.bitmap.width, image.bitmap.height);

    let certificate = await verify.getDccAndCheckValidity(code.data);
    console.log(certificate.dcc.payload)
    let check = await verify.checkRules(certificate.dcc.payload)
    
    if (check === null) {
        console.log("Alle Tests bestanden")
    } else {
        console.log("Es wurden Regeln nicht beachtet:")
        check.forEach((rule) => {
            console.log(global.rules[rule].getDescription("de"))
        })
        //console.log(dcc.payload);
    };
    */
}
boot();
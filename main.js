import fs from 'fs';
global.config = JSON.parse(fs.readFileSync("config.json"));
global.rules = {};

import verifyCerts from './modules/verifyCerts.js'

const verify = new verifyCerts();
async function boot() {
    //verify.check();
    verify.loadRules(global.config.ruleCountry);
    verify.loadValueSets();
    let dcc = await verify.getDccAndCheckValidity();
    let check = await verify.checkRules(dcc)
    if (check === null) {
        console.log("Alle Tests bestanden")
    } else {
        console.log("Es wurden Regeln nicht beachtet:")
        check.forEach((rule) => {
            console.log(global.rules[rule].getDescription("de"))
        })
        //console.log(dcc.payload);
    };
}
boot();
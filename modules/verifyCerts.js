
// Import Libraries
import * as x509 from "@peculiar/x509";
import { Crypto } from "@peculiar/webcrypto";

const crypto = new Crypto();
x509.cryptoProvider.set(crypto);

import cosette from "cosette";


import DCCcl from 'dcc-utils';
import fs from 'fs'
import fetch from 'node-fetch';
const DCC = DCCcl.DCC;
const Rule = DCCcl.Rule;


var trustList = [];

export default class verifyCerts {
    constructor() {
        console.log("Loading Digital Covid Certificate Validator...");
        console.log("This may take a while")
        try {
            trustList = JSON.parse(fs.readFileSync("trustList.json", "utf8"))

        } catch (e) {
            this.fetchTrustList("https://de.dscg.ubirch.com/trustList/DSC/");

        }
        trustList = this.convertTrustList(trustList);
        console.log("Loaded all valid certificate issuers")
        return;
    }


    async getDccAndCheckValidity(qrCodeData) {
        console.log("Checking new certificate...")
        const dcc = await DCC.fromImage("/home/wolff/covcert.jpg");
        const verified = await this.checkCert(dcc);

        console.log("Certificate", (verified.valid) ? "is" : "is not", "valid:", (!verified.valid) ? verified.reason : "");
        console.log("Name: " + dcc.payload.nam.gn.substr(0, 1) + ". " + dcc.payload.nam.fn);
        console.log("Date of Birth: " + dcc.payload.dob)
        console.log("Cert included these Vaccinations:");
        dcc.payload.v.forEach((v) => {
            console.log("Date:", v.dt, "Issuer:", v.is)
        });
        dcc.valid = verified.valid;

        return dcc;
    }
    async fetchTrustList(url) {
        const response = await fetch(url);
        let text = await response.text();
        let json = JSON.parse(text.split("\n")[1]);
        fs.writeFileSync("trustList.json", JSON.stringify(json), "utf8");
        trustList = json;
    }
    convertTrustList(input) {
        let output = {};
        input.certificates.forEach((cert) => {
            let x509cert = new x509.X509Certificate(cert.rawData);
            output[cert.kid] = { ...cert, ...x509cert }
        })
        return output;
    }
    async checkCert(dcc) {
        let cert;
        try {
            let valid = await cosette.sign.verify(dcc._coseRaw, async (kid) => {
                cert = trustList[kid.toString('base64')];
                return {
                    key: await crypto.subtle.importKey(
                        'spki',
                        cert.publicKey.rawData,
                        cert.publicKey.algorithm,
                        true, ['verify']
                    ),
                };
            });
            return { valid: true, cert: cert };
        } catch (e) {
            if (e instanceof cosette.sign.SignatureMismatchError) {
                return {valid: false, reason: "SignatureMismatchError"};
              }
              if (typeof cert === 'undefined') {
                return {valid: false, reason: "SigningAgencyNotFound"}
              }
        }

    }
    async loadRules(country) {
        let availableRules = fs.readdirSync(global.config.ruleDir + global.config.ruleCountry);
        availableRules.forEach((rule) => {
            global.rules[rule] = Rule.fromJSON(JSON.parse(fs.readFileSync(global.config.ruleDir + global.config.ruleCountry + "/" + rule + "/rule.json", "utf8")));
            console.log("Loaded rule", rule)
        })
    }
    async loadValueSets() {
        global.valueSets = {}
        let availableSets = fs.readdirSync(global.config.valuesetDir);
        availableSets.forEach((set) => {
            if (set.indexOf(".json") == -1)
                return;
            let content = JSON.parse(fs.readFileSync(global.config.valuesetDir + set, "utf8"))
            if (content.valueSetId != undefined) {
                global.valueSets[content.valueSetId + "-orig"] = content.valueSetValues;
                let arr = [];
                for (var i in content.valueSetValues) {
                    arr.push(i)
                }
                global.valueSets[content.valueSetId] = arr;
                console.log("Loaded Set", set, content.valueSetId)
            }

        })
    }
    async checkRules(dcc) {
        let validationClock = new Date().toISOString();
        let errors = []
        for (var rule in global.rules) {
            let ruleResult = global.rules[rule].evaluateDCC(dcc, { validationClock: validationClock, valueSets: global.valueSets })
            
            
            if (!ruleResult) {
                errors.push(rule);
            }
        }
        return (errors === [] ? null : errors)
    }


}
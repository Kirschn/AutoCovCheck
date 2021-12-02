
export default class covcheckStateMachine {
    constructor(requiredStates = {baseCheck: false, extendedCheck: false}) {
        this.states = {};
        this.requiredStates = requiredStates;
        this.rewrites = {}
        this.hold = false;
        this.lastInput = {type: null};
        this.event = null;
        this.person = {
            fn: null,
            gn: null,
            dob: null
        }
    }
    checkState() {
        let passed = true;
        for (var i in this.requiredStates) {
            if (this.requiredStates[i] && this.states[i] !== this.requiredStates[i]) {
                passed = false;
            }
        }
        if (passed && !this.hold) {
            this.outputModule.allowEntrance(this);
            if (this.event.logPersons) {
                this.event.createEventParticipant(this.person).then(participant => {
                    console.log("Added", this.person.gn, "to database")
                });
            }
        }
        return passed;
    }
    enterState(index, value) {
        console.log("State machine:", index, "=", value)
        if (this.hold) {
            return null;
        }
        if (this.rewrites[index] !== undefined) {
            index = this.rewrites[index]
            // rewrite for remapping 
        }
        if (this.requiredStates[index] === value) {
            this.states[index] = value;
            return this.checkState();
        } else {
            // got something we didn't need
            return null;
        }
    }
    requiredStatesFromEvent(event) {

        if (!event instanceof this.db.event)
            return;
        this.event = event;
        this.reset();
        this.rewrites = {};
        this.requiredStates = {"baseCheck": false, "extendedCheck": false}
        
        if (event.entranceWithVac) {
            this.rewrites["vaccination"] = "baseCheck";
            this.requiredStates["baseCheck"] = true;
        }
        if (event.entranceWithRecov) {
            this.rewrites["recovery"] = "baseCheck";
            this.requiredStates["baseCheck"] = true;
        }
        if (event.entranceWithRAT) {
            this.rewrites["rat"] = "baseCheck";
            this.requiredStates["baseCheck"] = true;
        }
        if (event.entranceWithNAAT) {
            this.rewrites["naat"] = "baseCheck"
            this.requiredStates["baseCheck"] = true;
        }
        if (event.entranceNeedsRAT) {
            this.rewrites["rat"] = "extendedCheck"
            this.requiredStates["extendedCheck"] = true;
        } 

        
        
    }
    
    registerDbController(db) {
        this.db = db;
    }
    registerOutputModule(output) {
        this.outputModule = output;
    }
    reset() {
        this.states = {};
        this.lastInput = {type: null}
        this.person = {
            gn: null,
            fn: null,
            db: null
        }
    }

}
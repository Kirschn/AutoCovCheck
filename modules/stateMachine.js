
export default class covcheckStateMachine {
    constructor(requiredStates = {}) {
        this.states = {};
        this.requiredStates = requiredStates;
        this.rewrites = {}
        this.hold = false;
        this.lastInput = {type: null};
    }
    checkState() {
        let passed = true;
        for (var i in this.requiredStates) {
            if (this.states[i] !== this.requiredStates[i]) {
                passed = false;
            }
        }
        if (passed && !this.hold) {
            this.outputModule.allowEntrance(this);
        }
        return passed;
    }
    enterState(index, value) {
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
        if (event.entranceWithVac) {
            this.rewrites["vaccination"] = "baseCheck";
            this.requiredStates["baseCheck"] = true;
        }
        if (event.entranceWithRecov) {
            this.rewrites["recovery"] = "baseCheck";
            this.requiredStates["baseCheck"] = true;
        }
        if (event.entranceWithAntigen) {
            this.rewrites["rat"] = "baseCheck";
            this.requiredStates["baseCheck"] = true;
        }
        if (event.entranceWithPcr) {
            this.rewrites["naat"] = "baseCheck"
            this.requiredStates["baseCheck"] = true;
        }
        if (event.entranceNeedsAntigen) {
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
    }

}
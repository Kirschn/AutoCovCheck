export default class covcheckOutputModule {
    constructor() {

    }
    allowEntrance(stateMachine) {
        console.log("Allowing Entrance")
        stateMachine.hold = true;
    }
}
import fs from 'fs';
global.config = JSON.parse(fs.readFileSync("config.json"));
try {
    var pigpio = await import("pigpio");
} catch (e) {
    console.log("Pigpio not found, disabling raspberrypi output")
    global.config.stateMachineConfig.raspberryPi.installed = false;
}



export default class covcheckOutputModule {
    constructor() {
        if (global.config.stateMachineConfig.raspberryPi.installed) {
            this.Gpio = pigpio.Gpio;
            this.doorPin = new this.Gpio(global.config.stateMachineConfig.raspberryPi.doorRelaisGPIO, {
                "mode": this.Gpio.OUTPUT
            });

            this.piWriteDoor(true);
        }

    }
    allowEntrance(stateMachine) {
        console.log("Allowing Entrance")
        stateMachine.hold = true;
        this.piWriteDoor(false);
        setTimeout(() => {
            this.piWriteDoor(true);
            stateMachine.reset();
            stateMachine.hold = false;
        }, global.config.stateMachineConfig.raspberryPi.doorOpenTime)
    }
    piWriteDoor(val) {
        if (!global.config.stateMachineConfig.raspberryPi.installed)
            return;
        this.doorPin.digitalWrite(val)
    }
}
import fs from 'fs';
import pigpio from 'pigpio';
global.config = JSON.parse(fs.readFileSync("config.json"));


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
            stateMachine.holf = false;
        }, global.config.stateMachineConfig.raspberryPi.doorOpenTime)
    }
    piWriteDoor(val) {
        if (!global.config.stateMachineConfig.raspberryPi.installed)
            return;
        this.doorPin.digitalWrite(val)
    }
}
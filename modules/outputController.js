var pigpio = null;
if (global.config.stateMachineConfig.raspberryPi.installed) {
    import("pigpio").then(module => {
        pigpio = module
    })
}

export default class covcheckOutputModule {
    constructor() {
        if (global.config.stateMachineConfig.raspberryPi.installed) {
            this.Gpio = pigpio.Gpio;
            this.doorPin = new this.Gpio(global.config.stateMachineConfig.raspberryPi.doorRelaisGPIO, {
                "mode": this.Gpio.OUTPUT
            });
        }

    }
    allowEntrance(stateMachine) {
        console.log("Allowing Entrance")
        stateMachine.hold = true;
        this.piWriteDoor(true);
        setTimeout(() => {
            this.piWriteDoor(false);
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
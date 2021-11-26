if (global.stateMachineConfig.raspberryPi.installed) {
    import pigpio from 'pigpio';
}

export default class covcheckOutputModule {
    constructor() {
        if (global.stateMachineConfig.raspberryPi.installed) {
            this.Gpio = pigpio.Gpio;
            this.doorPin = new this.Gpio(global.stateMachineConfig.raspberryPi.doorRelaisGPIO, {
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
        if (!global.stateMachineConfig.raspberryPi.installed)
            return;
        this.doorPin.digitalWrite(val)
    }
}
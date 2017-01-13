const heatingswitch = require('./heatingswitch.js');
// Require thermometer

class Thermostat {
  constructor(scheduler, logger) {
    this._scheduler = scheduler;
    this._logger = logger;
    this._heatingSwitch = new heatingswitch.HeatingSwitch();

    var thermostat = this;
    setInterval( ()=> {
      this.timerCallback();
    }, 1*1000)
  }

  timerCallback() {
      const targetTemperature = this.targetTemperature();
      if (this.targetTemperature() != null) {
        const currentTemperature = this.currentTemperature();
        this._logger.debug(`Thermostat callback - target temperature: `
                           + `${targetTemperature}, actual temperature: `
                           + `${currentTemperature}`);
        if (this.currentTemperature() < this.targetTemperature()) {
          this._logger.debug("Thermostat callback - it's too cold!");
          if (!this.isHeatingOn()) {
            this._logger.debug("Thermostat callback - switching heating on");
            this._heatingSwitch.setOn(true);
          }
          return;
        }
      }

      this._logger.debug("Thermostat callback - no heating needed");
      if (this.isHeatingOn()) {
          this._logger.debug("Thermostat callback - switching heating off");
          this._heatingSwitch.setOn(false);
      }
  }

  currentTemperature() {
    // From thermometer.
    return 0.0;
  }

  targetTemperature() {
    return this._scheduler.scheduledTemperatureNow().temperature;
  }

  isHeatingOn() {
    return this._heatingSwitch.isOn();
  }
}

exports.Thermostat = Thermostat;

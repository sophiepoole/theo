const heatingswitch = require('./heatingswitch.js');
// Require thermometer

class Thermostat {
  constructor(scheduler, logger) {
    this._scheduler = scheduler;
    this._logger = logger;
    this._heatingSwitch = new heatingswitch.HeatingSwitch();

    // Set up interval.
  }

  currentTemperature() {
    // From thermometer.
    return 23.1;
  }

  targetTemperature() {
    return this._scheduler.scheduledTemperatureNow();
  }

  isHeatingOn() {
    return this._heatingSwitch.isOn();
  }
}

exports.Thermostat = Thermostat;

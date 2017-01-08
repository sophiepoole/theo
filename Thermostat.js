const HeatingSwitch = require('./HeatingSwitch.js');
// Require thermometer

module.exports = class Thermostat {
  constructor(scheduler, logger) {
    this._scheduler = scheduler;
    this._logger = logger;
    this._heatingSwitch = new HeatingSwitch();

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

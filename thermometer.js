module.exports = class Thermometer {
  constructor() {
    var initialReading = getTemperature();
    console.log("Thermometer is operational: initial reading of "
                + initialReading);
  }

  getTemperature() {
    return 23.3;
  }
}

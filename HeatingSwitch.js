module.exports = class HeatingSwitch {
  constructor() {
    // Check things are working!

    var heatingIsOn = false;

    this.isOn = function () {
      return heatingIsOn;
    }

    this.setOn = function (turnOn) {
      if (turnOn) {
        // Open/close the relay.
      } else {
        // Open/close the relay.
      }
      heatingIsOn = turnOn;
    }

    console.log("Everything is brilliant.");
  }
}

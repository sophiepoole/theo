module.exports = class HeatingSwitch {
  constructor() {
    this._heatingIsOn = false;
  }

  isOn() {
    return this._heatingIsOn;
  }

  setOn(turnOn) {
    if (turnOn) {
      // Open/close the relay.
    } else {
      // Open/close the relay.
    }
    this._heatingIsOn = turnOn;
    return true;
  }
}

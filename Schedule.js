const fs = require('fs');
const moment = require('moment');

const timeFormat = "HH:mm";
const dateFormat = "YYYY-MM-DD";

module.exports = class Schedule {
  constructor() {
    this._savedSchedulePath = "./schedule.data";
    this._repeatedTimes = [];
    this._oneOffTimes = [];
    this._oneOffTimesStartDate = null;

    if (fs.existsSync(this._savedSchedulePath)
        && fs.statSync(this._savedSchedulePath).isFile()) {
      this.load();
    }
  }

  _validateTimes(data) {
    data.forEach( (period) => {
      parsedTimes = [];
      for (var i = 0; i < 2; i++) {
        var time;
        try {
          time = period[i];
        } catch(e) {
          throw new Error(`Failed to extract time index ${i} from ${period}`);
        }
        const parsedTime = moment(time, timeFormat, true);
        if (!parsedTime.isValid()) {
          throw new Error(`Failed to parse "${time}" as "${timeFormat}"`);
        }
        parsedTimes.push(parsedTime);
      }
      if (period.length > 2) {
        throw new Error(`Period "${period}" has more than two elements`);
      }
      if (parsedTimes[1].isBefore(parsedTimes[0])) {
        throw new Error(`Period "${period}" ends before it starts`);
      }
    });
    return data;
  }

  _validateDate(data) {
    const parsedDate = moment(data, dateFormat, true);
    if (!parsedDate.isValid()) {
      throw new Error(`Failed to parse "${data}" as "${dateFormat}"`);
    }
    return data;
  }

  getRepeatedTimes() {
    return this._repeatedTimes;
  }

  getOneOffTimes() {
    return this._oneOffTimes;
  }

  _getTimesFromJson(json) {
    if (!json.schedule) {
      throw new Error(`No "schedule" key in ${JSON.stringify(json)}`);
    }
    return json.schedule;
  }

  setRepeatedTimes(json) {
    this._repeatedTimes = this._validateTimes(this._getTimesFromJson(json));
    this.save();
    return this._repeatedTimes;
  }

  setOneOffTimes(json) {
    this._oneOffTimes = this._validateTimes(this._getTimesFromJson(json));
    if (!json.startDate) {
      throw new Error(`No "startDate" key in ${JSON.stringify(json)}`);
    }
    this._validateDate(json.startDate);
    if (moment(json.startDate, dateFormat, true).isBefore(moment(), "day")) {
      throw new Error(`"${json.startDate}" is in the past`);
    }
    this._oneOffTimesStartDate = json.startDate;
    this.save();
    return this._oneOffTimes;
  }

  currentStateIsOn() {
    const now = moment();
    var schedule = this._repeatedTimes;
    if (this._oneOffTimesStartDate != null
        && now.isSame(this._oneOffTimesStartDate, "day")) {
      schedule = this._oneOffTimes;
    }
    return schedule.some( (period) => {
      const start = moment(period[0], timeFormat, true);
      const end   = moment(period[1], timeFormat, true);
      return now.isBetween(start, end, null, "[)");
    });
  }

  save() {
    var state = {
      "repeatedTimes":        this._repeatedTimes,
      "oneOffTimes":          this._oneOffTimes,
      "oneOffTimesStartDate": this._oneOffTimesStartDate
    }
    fs.writeFileSync(this._savedSchedulePath, JSON.stringify(state, null, 2));
  }

  load() {
    var state = JSON.parse(fs.readFileSync(this._savedSchedulePath));
    this._repeatedTimes = this._validateTimes(state.repeatedTimes);
    this._oneOffTimes   = this._validateTimes(state.oneOffTimes);
    this._oneOffTimesStartDate =
      this._validateDate(state.oneOffTimesStartDate);
    console.log("Loaded schedule from disk: " + JSON.stringify(state));
  }
}

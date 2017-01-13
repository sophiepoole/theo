const fs = require('fs');
const moment = require('moment');

const timeFormat = "HH:mm";
const dateFormat = "YYYY-MM-DD";

// Schedule format:
// {"schedule": [{"start": 01:56, "end": 23:01, "temperature": 23.1}, ...]}
//
// Repeated schedule format:
// {"startDate": "2017-05-28", schedule": [...]}

class Scheduler {
  constructor(logger) {
    this._logger = logger;
    this._savedSchedulePath = "./schedule.data";
    this._repeatedSchedule = [];
    this._oneOffSchedule = [];
    this._oneOffScheduleStartDate = null;

    if (fs.existsSync(this._savedSchedulePath)
        && fs.statSync(this._savedSchedulePath).isFile()) {
      this.load();
    }
  }

  _validateSchedule(schedule) {
    schedule.forEach( (period) => {
      ["start", "end", "temperature"].forEach( (key) => {
        if (!(key in period)) {
          throw new Error(`No "${key}" key in "${period}"`);
        }
      });
      var parsedTimes = {};
      ["start", "end"].forEach( (key) => {
        const time = period[key];
        parsedTimes[key] = moment(time, timeFormat, true);
        if (!parsedTimes[key].isValid()) {
          throw new Error(`Failed to parse "${time}" as "${timeFormat}"`);
        }
      });
      if (parsedTimes.end.isBefore(parsedTimes.start)) {
        throw new Error(`Period "${period}" ends before it starts`);
      }
      if (isNaN(period.temperature)) {
        throw new Error(`Temperature "${period.temperature}" is not a number`);
      }
    });
    return schedule;
  }

  _validateDate(date) {
    if (!moment(date, dateFormat, true).isValid()) {
      throw new Error(`Failed to parse "${date}" as "${dateFormat}"`);
    }
    return date;
  }

  getRepeatedSchedule() {
    return {"schedule": this._repeatedSchedule};
  }

  getOneOffSchedule() {
    return {"schedule": this._oneOffSchedule,
            "startDate": this._oneOffScheduleStartDate};
  }

  _getScheduleFromJson(json) {
    if (!json.schedule) {
      throw new Error(`No "schedule" key in ${JSON.stringify(json)}`);
    }
    return json.schedule;
  }

  setRepeatedSchedule(json) {
    const schedule = this._getScheduleFromJson(json);
    this._validateSchedule(schedule);
    this._repeatedSchedule = schedule;
    this.save();
    return this.getRepeatedSchedule();
  }

  setOneOffSchedule(json) {
    const schedule = this._getScheduleFromJson(json);
    this._validateSchedule(schedule);
    if (!("startDate" in json)) {
      throw new Error(`No "startDate" key in ${JSON.stringify(json)}`);
    }
    if (json.startDate != null) {
      this._validateDate(json.startDate);
      if (moment(json.startDate, dateFormat, true).isBefore(moment(), "day")) {
        throw new Error(`"${json.startDate}" is in the past`);
      }
    }
    this._oneOffSchedule = schedule;
    this._oneOffScheduleStartDate = json.startDate;
    this.save();
    return this.getOneOffSchedule();
  }

  isOneOffScheduleActive() {
    return moment().isSame(this._oneOffScheduleStartDate, "day");
  }

  scheduledTemperatureNow() {
    var schedule;
    if (this.isOneOffScheduleActive()) {
      schedule = this._oneOffSchedule;
    } else {
      schedule = this._repeatedSchedule;
    }

    var result = null;
    schedule.forEach( (period) => {
      const start = moment(period.start, timeFormat, true);
      const end   = moment(period.end,   timeFormat, true);
      if (moment().isBetween(start, end, null, "[)")) {
        result = period.temperature;
      }
    });

    return {"temperature": result};
  }

  save() {
    var state = {
      "repeatedSchedule":        this._repeatedSchedule,
      "oneOffSchedule":          this._oneOffSchedule,
      "oneOffScheduleStartDate": this._oneOffScheduleStartDate
    }
    fs.writeFileSync(this._savedSchedulePath, JSON.stringify(state, null, 2));
  }

  load() {
    var state = JSON.parse(fs.readFileSync(this._savedSchedulePath));
    this._repeatedSchedule = this._validateSchedule(state.repeatedSchedule);
    this._oneOffSchedule   = this._validateSchedule(state.oneOffSchedule);
    if (state.oneOffScheduleStartDate != null) {
      this._validateDate(state.oneOffScheduleStartDate);
    }
    this._oneOffScheduleStartDate = state.oneOffScheduleStartDate;
    this._logger.info("Loaded schedule from disk: " + JSON.stringify(state));
  }
};

exports.Scheduler = Scheduler;
exports.timeFormat = timeFormat;
exports.dateFormat = dateFormat;

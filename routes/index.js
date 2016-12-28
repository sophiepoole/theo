var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser')

router.get('/heating', function(req, res) {
  res.json({ 'isOn': req.app.locals.heating.isOn()});
});

router.post('/heating', bodyParser.json(), function(req, res) {
  var key = 'setOn';
  if (req.body.key == undefined
      || (req.body.key != true && req.body.key != false)) {
    return res.sendStatus(400);
  }
  
  req.app.locals.heating.setOn(req.body[key]);
  return res.sendStatus(200);
});

const sendScheduleTimesJson = (res, times) => {
  return res.json({"schedule": times})
}

const sendError = (res, message) => {
  return res.status(400).json({"Error": message});
}

router.get('/schedule/:type', function(req, res) {
  const schedule = req.app.locals.schedule;
  if (req.params.type === "repeated") {
    return sendScheduleTimesJson(res, schedule.getRepeatedTimes());
  } else if (req.params.type === "one-off") {
    return sendScheduleTimesJson(res, schedule.getOneOffTimes());
  }
  return sendError(res, `Schedule type "${req.params.type}" is invalid`);
});

router.post('/schedule/:type', bodyParser.json(), function(req, res) {
  try {
    var result;
    var schedule = req.app.locals.schedule;
    const body = req.body;
    if (req.params.type === "repeated") {
      result = schedule.setRepeatedTimes(body);
    } else if (req.params.type === "one-off") {
      result = schedule.setOneOffTimes(body);
    } else {
      throw new Error(`Schedule type "${req.params.type}" is invalid`);
    }
  } catch(e) {
    return sendError(res, e.message);
  }
  return sendScheduleTimesJson(res, result);
});

router.get('/current-state', function(req, res) {
  return res.json({"isOn": req.app.locals.schedule.currentStateIsOn()});
});

module.exports = router;

var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser')

const sendError = (res, message) => {
  return res.status(400).json({"Error": message});
}

router.get('/schedule/:type', function(req, res) {
  const scheduler = req.app.locals.scheduler;
  if (req.params.type === "repeated") {
    return res.json(scheduler.getRepeatedSchedule());
  } else if (req.params.type === "one-off") {
    return res.json(scheduler.getOneOffSchedule());
  }
  return sendError(res, `Schedule type "${req.params.type}" is invalid`);
});

router.post('/schedule/:type', bodyParser.json(), function(req, res) {
  try {
    var scheduler = req.app.locals.scheduler;
    if (req.params.type === "repeated") {
      return res.json(scheduler.setRepeatedSchedule(req.body));
    } else if (req.params.type === "one-off") {
      return res.json(scheduler.setOneOffSchedule(req.body));
    }
    throw new Error(`Schedule type "${req.params.type}" is invalid`);
  } catch(e) {
    return sendError(res, e.message);
  }
});

module.exports = router;

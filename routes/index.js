var express = require('express');
var router = express.Router();

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()

router.get('/heating', function(req, res) {
  res.json({ 'isOn': req.app.locals.heating.isOn()});
});

router.post('/heating', jsonParser, function(req, res) {
  var key = 'setOn';
  if (!(key in req.body)) {
      return res.sendStatus(400);
  }
  req.app.locals.heating.setOn(req.body[key]);
  return res.sendStatus(200);
});

module.exports = router;

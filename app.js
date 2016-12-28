const express = require('express')
var app = express()

var HeatingSwitch = require('./HeatingSwitch.js');
app.locals.heating = new HeatingSwitch();

var Schedule = require('./Schedule.js');
app.locals.schedule = new Schedule();

const INDEX = require('./routes/index');
app.use('/', INDEX);

const PORT = process.env.PORT || 3000
app.listen(PORT, function(req, res) {
  console.log(`Listening on port ${PORT}`);
});

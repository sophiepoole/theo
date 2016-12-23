const express = require('express')
var app = express()

var HeatingSwitch = require('./HeatingSwitch.js');
app.locals.heating = new HeatingSwitch();

const PORT = process.env.PORT || 3000

const INDEX = require('./routes/index');

app.use('/', INDEX);

app.listen(PORT, function(req, res) {
  console.log(`Listening on port ${PORT}`);
});

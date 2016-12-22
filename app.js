var express = require('express')
var app = express()

const PORT = process.env.PORT || 3000

const INDEX = require('./routes/index');

app.use('/api', INDEX);

app.listen(PORT function(req, res) {
  console.log(`Listening on port ${PORT}`);
});

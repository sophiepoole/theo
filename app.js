const express = require("express")
var app = express()

const winston = require("winston");
app.locals.logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({"timestamp": true})
  ]
});
app.locals.logger.info("Application started");

const Scheduler = require("./Scheduler.js");
app.locals.scheduler = new Scheduler(app.locals.logger);

const Thermostat = require("./Thermostat.js");
app.locals.thermostat = new Thermostat(app.locals.scheduler, app.locals.logger);

const INDEX = require("./routes/index");
app.use("/", INDEX);

const PORT = process.env.PORT || 3000
app.listen(PORT, (req, res) => {
  app.locals.logger.info(`Listening on port ${PORT}`);
});

module.exports = app;

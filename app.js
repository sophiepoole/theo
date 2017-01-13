const express = require("express")
var app = express()

const winston = require("winston");
app.locals.logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(
        {"timestamp": true,
        "level": "debug"}
    )
  ]
});
app.locals.logger.info("Application started");

const scheduler = require("./scheduler.js");
app.locals.scheduler = new scheduler.Scheduler(app.locals.logger);

const thermostat = require("./thermostat.js");
app.locals.thermostat = new thermostat.Thermostat(app.locals.scheduler,
                                                  app.locals.logger);

const INDEX = require("./routes/index");
app.use("/", INDEX);

const PORT = process.env.PORT || 3000
app.listen(PORT, (req, res) => {
  app.locals.logger.info(`Listening on port ${PORT}`);
});

module.exports = app;

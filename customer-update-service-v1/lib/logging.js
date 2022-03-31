"use strict";

const winston = require("winston");
const expressWinston = require("express-winston");
const StackdriverTransport = require("@google-cloud/logging-winston")
  .LoggingWinston;
const configObj = require("./config");
const level = configObj.log_level;
const { format } = require("logform");

const cloudReqLogger = expressWinston.logger({
  level: "info",
  transports: [
    new StackdriverTransport({
      level: "info"
    })
  ],
  expressFormat: true,
  meta: true
});

const localReqLogger = expressWinston.logger({
  level: "info",
  transports: [
    new winston.transports.Console({
      json: false,
      colorize: true,
      level: level
    })
  ],
  expressFormat: true,
  meta: true
});

const cloudLogger = new winston.createLogger({
  level: level,
  transports: [new StackdriverTransport()]
});

const localLogger = new winston.createLogger({
  level: level,
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.align(),
        format.printf(
          info => `${info.timestamp} ${info.level}:\t${info.message}`
        )
      )
    })
  ]
});

if (configObj.log_environment === "local") {
  module.exports = {
    requestLogger: localReqLogger,
    errorLogger: localLogger
  };
} else {
  module.exports = {
    requestLogger: cloudReqLogger,
    errorLogger: cloudLogger
  };
}

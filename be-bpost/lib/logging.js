'use strict';

const winston = require('winston');
const expressWinston = require('express-winston');
const StackdriverTransport = require('@google-cloud/logging-winston').LoggingWinston;
const {format} = require('logform');

const logLevel = process.env.LOG_LEVEL || 'info';
const logEnv = process.env.LOG_ENV || 'local';

const cloudRequestLogger = expressWinston.logger({
  level: logLevel,
  transports: [new StackdriverTransport({level: logLevel})],
  expressFormat: true,
  meta: true,
});

const localRequestLogger = expressWinston.logger({
  level: logLevel,
  transports: [new winston.transports.Console({json: false, colorize: true, level: logLevel})],
  expressFormat: true,
  meta: true,
});

const cloudSimpleLogger = new winston.createLogger({
  level: logLevel,
  transports: [new StackdriverTransport()],
});

const localSimpleLogger = new winston.createLogger({
  level: logLevel,
  transports: [
    new winston.transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.align(),
        format.printf(logEntry => `${logEntry.timestamp} ${logEntry.level}:\t${logEntry.message}`)
      ),
    }),
  ],
});

if (logEnv === 'local') {
  module.exports = {
    requestLogger: localRequestLogger,
    logger: localSimpleLogger,
  };
} else {
  module.exports = {
    requestLogger: cloudRequestLogger,
    logger: cloudSimpleLogger,
  };
}

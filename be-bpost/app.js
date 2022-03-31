'use strict';

const express = require('express');
const app = express();
const fileProcessor = require('./lib/file-processor.js');
const decrypt = require('./lib/decrypt');
const reqLogger = require('./lib/logging').requestLogger;
const logger = require('./lib/logging').logger;
const secMngr = require('./lib/secretManager');

app.use(reqLogger);

/*this the entry point in the program. 
when a get call is received, it will trigger the main function.
*/
app.get('/ftp-files/process', (req, res) => {
  logger.info('Start processing BEBPOST files');
  fileProcessor.processMain().then(() => {
    res.statusCode = 200;
    res.send('OK');
    logger.info('Done processing BEBPOST files');
  });
});

async function setup() {
  return new Promise((resolve, reject) => {
    secMngr
        .setSecretsAsEnvVars()
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

const PORT = process.env.PORT || 8080;
setup()
  .then(() => {
    app.listen(PORT, () => {
      logger.info('App listening on port ' + PORT);
    });
  })
  .catch(err => logger.error('Exception occured in app.setup(). ' + err));

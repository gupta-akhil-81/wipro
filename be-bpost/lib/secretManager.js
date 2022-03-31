'use strict';
// Import the Secret Manager client and instantiate it:
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();
const logger = require('./logging').logger;

/* 
Gets a secret manager key, get value and insert it as a ENV value
*/
async function getAndSetSecret(secretToGet, envVarToSet) {
  return new Promise(function(resolve, reject) {
    try {
      client
        .accessSecretVersion({
          name: secretToGet,
        })
        .then(secretResponse => {
          let secretPayload = secretResponse[0].payload.data.toString('utf8');
          process.env[envVarToSet] = secretPayload;
          logger.info('Loaded secret ' + secretToGet + ' OK');
          resolve(secretPayload);
        })
        .catch(err => {
          logger.error(err);
          reject(err);
        });
    } catch (ex) {
      logger.error(ex);
      reject(ex);
    }
  });
}

/* 
Loops all _SECURE env vars and calls the getAndSetSecret method for each of them
*/
module.exports.setSecretsAsEnvVars = async function() {
  return new Promise(function(resolve, reject) {
    try {
      let projectId = process.env.GOOGLE_CLOUD_PROJECT || 'xyz-icf-integration-dev';
      let promArray = [];
      for (var envVar in process.env) {
        if (envVar.endsWith('SECURE')) {
          //ENV var ends with _SECURE, get value from Secrets manager

          try {
            let secretKey = process.env[envVar]; //get the secretkey
            let secretPath = `projects/${projectId}/secrets/${secretKey}/versions/latest`; //create secret name/path
            var n = envVar.indexOf('_SECURE');
            var envVarToSet = envVar.substring(0, n); //get env key/name for the secret value
            let p = getAndSetSecret(secretPath.toString(), envVarToSet);
            promArray.push(p);
          } catch (err) {
            logger.error('Error occured in setSecretsAsEnvVars method.', err);
            reject(err);
          }
        }
      }

      //wait untill all sub-tasks are done
      Promise.all(promArray)
        .then(data1 => {
          resolve(data1);
        })
        .catch(err => {
          logger.error(err);
          reject(err);
        });
    } catch (err) {
      logger.error(err);
      reject(err);
    }
  });
};
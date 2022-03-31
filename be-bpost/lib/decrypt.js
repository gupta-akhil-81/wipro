'use strict';

const logger = require('./logging').logger;

module.exports.SetEnvVars = async function(
  projectId = process.env.GOOGLE_CLOUD_PROJECT || 'xyz-icf-integration-dev', // Your GCP projectId
  keyRingId = process.env.KEY_RING_ID || 'icf-ci-kms-ring', // Name of the crypto key's key ring
  cryptoKeyId = process.env.KEY_ID || 'icf-ci-kms-key' // Name of the crypto key, e.g. "my-key"
) {
  return new Promise(function(resolve, reject) {
    try {
      var promArray = [];
      for (var okey in process.env) {
        if (okey.endsWith('SECURE')) {
          //ENV var ends with _SECURE, decrypt it.
          try {
            var p = decryptAndSet(projectId, keyRingId, cryptoKeyId, okey);
            promArray.push(p);
          } catch (err) {
            logger.error('Exception #1 occured in decrypt.SetEnvVars().', {stack: err.stack});
          }
        }
      }
      //wait untill all sub-tasks are done
      Promise.all(promArray)
        .then(data1 => {
          return data1.toString();
        })
        .then(data2 => {
          //exit metod and resolved promise
          resolve(data2);
        });
    } catch (err) {
      logger.error('Exception #2 occured in decrypt.SetEnvVars().', {stack: err.stack});
      reject(err);
    }
  });
};

async function decryptAndSet(
  projectId, // Your GCP projectId
  keyRingId, // Name of the crypto key's key ring
  cryptoKeyId, // Name of the crypto key, e.g. "my-key"
  envVar
) {
  return new Promise(function(resolve, reject) {
    try {
      var n = envVar.indexOf('_SECURE');
      var envVarNew = envVar.substring(0, n);
      // Imports the @google-cloud/kms client library
      const kms = require('@google-cloud/kms');
      // Instantiates an authorized client
      const kmsClient = new kms.KeyManagementServiceClient();
      const locationId = 'global';
      //Create path to key
      const formattedName = kmsClient.cryptoKeyPath(projectId, locationId, keyRingId, cryptoKeyId);
      //read encrypted ENV VAR
      var ecryptStr = process.env[envVar];
      //Convert base64 string to buffer
      var buf1 = Buffer.from(ecryptStr, 'base64');

      //create decrypt request object
      var request = {
        name: formattedName,
        ciphertext: buf1,
      };

      kmsClient
        .decrypt(request)
        .then(responses => {
          var response = responses[0];
          process.env[envVarNew] = response.plaintext;
          resolve(response.plaintext);
        })
        .catch(err => {
          logger.error('Exception #1 occured in decrypt.decryptAndSet().', {stack: err.stack});
          reject(err);
        });
    } catch (err) {
      logger.error('Exception #2 occured in decrypt.decryptAndSet().', {stack: err.stack});
      reject(err);
    }
  });
}

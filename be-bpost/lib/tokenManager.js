'use strict';

var tokenMngr = require('request-promise');
const icmTokenKey = 'ICM_API_TOKEN';
const memCache = require('memory-cache');
const logger = require('./logging').logger;

/*get a new token from token service and insert this into the local in-meme cache*/
async function renewToken() {
  return await tokenMngr
    .post({
      url: process.env.FIND_TOKENURL,
      json: true,
      body: {
        grant_type: process.env.FIND_GRANT_TYPE,
        client_id: process.env.FIND_TOKEN_CLIENTID,
        client_secret: process.env.FIND_TOKEN_CLIENTSECRET,
        audience: process.env.FIND_AUDIENCE,
      },
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        Connection: 'close',
      },
    })
    .then(responseBody => {
      memCache.put(
        icmTokenKey,
        responseBody.token_type + ' ' + responseBody.access_token,
        responseBody.expires_in * 1000
      );
      let icmApiToken = memCache.get(icmTokenKey);
      logger.info('Renewed token OK');
      return icmApiToken;
    });
}
/* Get the token to use for calls to ICMC API */
module.exports.getBearerToken = async function() {
  //check if we have an auth token in cache
  let apiAuthToken = await memCache.get(icmTokenKey);
  if (apiAuthToken) {
    return apiAuthToken;
  } else {
    return await renewToken().then(token => {
      return token;
    });
  }
};

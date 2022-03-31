'use strict';
const logger = require('./logging').logger;
var request = require('request');
const tokenMngr = require('./tokenManager');

// get uid based on xyz family number
function getUID(index, familyId, fileName) {
  const findUrl = process.env.FIND_URL;

  return new Promise(resolve => {
    tokenMngr.getBearerToken().then(apiToken => {
      request(
        {
          url: findUrl,
          method: 'POST',
          json: true,
          headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'unique-rq-id': index,
            'x-client-id': process.env.FIND_CLIENTID,
            Authorization: apiToken,
          },
          body: {
            find: {
              findMeta: {
                consumer: 'BEBPOST',
                resultSet: 'LIMITED',
                pageSize: 10,
                customerType: 'Individual',
              },
              exactMatch: {
                status: 'Active',
                cardNumber: familyId,
              },
            },
          },
        },
        function(error, response, body) {
          var uid = 'MISSING';
          if (!error && response.statusCode === 200 && !body.errorCode) {
            if (body.customers[0]) {
              uid = body.customers[0].partyUId;
              resolve(uid);
            } else {
              logger.warn(
                'PartyUID for family number not found for record ' +
                  index +
                  ' in file ' +
                  fileName +
                  '. Loyality number=' +
                  familyId,
                {
                  dataFileName: fileName,
                  recordIndex: index,
                  familyID: familyId,
                  errorMessage:
                    'Error when looking up UID for familiy number. Response:' +
                    JSON.stringify(response),
                }
              );
              resolve('MISSING');
            }
          } else {
            logger.warn(
              'PartyUID for family number not found for record ' +
                index +
                ' in file ' +
                fileName +
                '. Loyality number=' +
                familyId,
              {
                dataFileName: fileName,
                recordIndex: index,
                familyID: familyId,
                errorMessage:
                  'Error when looking up UID for familiy number. Response:' +
                  JSON.stringify(response),
              }
            );
            resolve('MISSING');
          }
        }
      );
    });
  });
}

function getUserFromCard(cardNumber) {
  const findUrl = process.env.FIND_URL;

  return new Promise(resolve => {
    tokenMngr.getBearerToken().then(apiToken => {
      request(
        {
          url: findUrl,
          method: 'POST',
          json: true,
          headers: {
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'unique-rq-id': Date.now(),
            'x-client-id': process.env.FIND_CLIENTID,
            Authorization: apiToken,
          },
          body: {
            find: {
              findMeta: {
                consumer: 'BEBPOST',
                resultSet: 'LIMITED',
                pageSize: 10,
                customerType: 'Individual',
              },
              exactMatch: {
                cardNumber: cardNumber,
              },
            },
          },
        },
        function(error, response, body) {
          if (!error && response.statusCode === 200 && !body.errorCode) {
            if (body.customers[0]) {
              resolve(body.customers[0]);
            } else {
              logger.warn('PartyUID for family number not found for loyality number=' + cardNumber);
              resolve('MISSING');
            }
          } else {
            logger.warn('PartyUID for family number not found for loyality number=' + cardNumber);
            resolve('MISSING');
          }
        }
      );
    });
  });
}
module.exports.getUID = getUID;
module.exports.getUserFromCard = getUserFromCard;

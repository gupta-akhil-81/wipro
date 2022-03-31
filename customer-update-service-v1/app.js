/* eslint-disable no-unused-vars */
"use strict";
//TODO: add trace and debug logic / implementation

const express = require("express");
const bodyParser = require("body-parser");
const reqLogging = require("./lib/logging").requestLogger;
const messageParser = require("./lib/messageParser");
const tokenValidator = require("./lib/tokenHelper");
const custInteractionPubSubSender = require("./lib/custInteractionPubSubSender");
const configLoader = require("./lib/envLoader");
var configObj = require("./lib/config");
var logging = require("./lib/logging").errorLogger;
var apiCaller = require("./lib/cmApiCaller");

const jsonBodyParser = bodyParser.json();
var compression = require("compression");
const app = express();
let msgCounter = 0;
app.use(compression());
app.use(reqLogging);

const heartbeat = require("./lib/heartbeat");
let readyToRock = false;

// [END requests]

/* app.post('/cust-interac', jsonBodyParser, async (req, res) => {

  let message = req.body.message;
  let buffer = Buffer.from(message.data, "base64");
  let data = buffer ? buffer.toString() : null;
  let retailUnit = message.attributes["retailUnit"] || null;
  let partyUId = message.attributes["partyUId"] || null;
  let jsonData = JSON.parse(data);

    
  custInteractionPubSubSender.sendCustInteractionPubsub(
    partyUId, 
    retailUnit, 
    message.messageId, 
    jsonData.update.customer.updated, 
    jsonData.update.customer.addresses[0].contextType    
  );

  res.status(200).send("Ok");

}); */

app.post(
  "/_ah/push-handlers/customers-updates/push",
  jsonBodyParser,
  async (req, res) => {
    // check that Pub/Sub-generated token is there
    if (tokenValidator.ValidateVerificationToken(req.query.token) !== 200) {
      res.status(400).send("Invalid request");
      return;
    }

    // Verify that the push request originates from Cloud Pub/Sub and is authenticated
    /*
  try {
    if (req.header("Authorization") !== null) {
      // Get the Cloud Pub/Sub-generated JWT in the "Authorization" header.
      const bearer = req.header("Authorization");
      const claims = await tokenValidator.ValidateToken(bearer);
      //Check if the Cloud Pub/Sub-generated JWT/account is the expected one
      if (tokenValidator.ValidateAccount(claims.email) !== true) {
        res.status(400).send("Invalid request");
        return;
      }
    } else {
      res.status(400).send("Invalid request");
      return;
    }
  } catch (err) {
    console.log("Error in tokem, with claims" + err);
    res.status(400).send("Invalid request");
    return;
  }
 */

    try {
      var message = req.body ? req.body.message : null;
      var messageId = message.messageId;
      //Check message had correct format
      var checkedMessage = messageParser.parseMessageBody(req.body);
      //Try parse message
      var resultData = messageParser.decodeAndParseMsg(checkedMessage);
      var jsonData = JSON.parse(resultData.data);

      var dataChanged = false;
      if (
        resultData.operation.toLowerCase() &&
        resultData.partyUId &&
        resultData.retailUnit
      ) {
        /* Udaya Changes Starts for ICF-998 & ICF-2098 */
        if (
          jsonData.create ||
          jsonData.update ||
          jsonData.input ||
          jsonData.delete
        ) {
          if (configObj.call_icm_customer_api.toLowerCase() === "true") {
            if (
              configObj.use_api_customer_cloud_tasks.toLowerCase() === "true" &&
              !jsonData.delete
            ) {
              var customerMasterApiCloudTask = apiCaller.customerMasterApiCloudTask(
                messageId,
                configObj.icm_api_base_url,
                resultData.operation.toLowerCase(),
                resultData.retailUnit,
                resultData.partyUId,
                resultData.sourceSystem,
                resultData.targetSystem,
                jsonData,
                configObj.projectId,
                configObj.cloud_task_location,
                configObj.cloud_task_queue,
                process.env.icm_onprem_client_secret,
                process.env.icm_onprem_client_id,
                process.env.icm_onprem_apigw_key
              );
              customerMasterApiCloudTask
                .then(() => {
                  if (jsonData.interaction) {
                    custInteractionPubSubSender.sendCustInteractionPubsub2(
                      resultData.partyUId,
                      resultData.retailUnit,
                      messageId,
                      jsonData.interaction.data
                    );
                  }
                  msgCounter++;
                  logging.info(
                    `Submitted message #${msgCounter} with id ${messageId} and partyUid ${
                      resultData.partyUId
                    } from retailUnit ${resultData.retailUnit} and consumer ${
                      resultData.consumer
                    } for operation ${resultData.operation.toUpperCase()} to cloud task.`
                  );
                  res.status(200).send();
                })
                .catch(err => {
                  msgCounter++;
                  logging.error(
                    `Error occurred while processing message #${msgCounter} with id ${messageId} and partyUid ${
                      resultData.partyUId
                    } from retailUnit ${resultData.retailUnit} and consumer ${
                      resultData.consumer
                    } for operation ${resultData.operation.toUpperCase()} to cloud task.`,
                    err
                  );
                  res.status(200).send(err);
                });
            } else {
              var customerMasterApi = apiCaller.customerMasterApiHttp(
                messageId,
                configObj.icm_api_base_url,
                resultData.operation.toLowerCase(),
                resultData.retailUnit,
                resultData.partyUId,
                resultData.sourceSystem,
                resultData.targetSystem,
                jsonData,
                process.env.icm_onprem_client_secret,
                process.env.icm_onprem_client_id,
                process.env.icm_onprem_apigw_key
              );
              customerMasterApi
                .then(customer => {
                  if (jsonData.interaction) {
                    custInteractionPubSubSender.sendCustInteractionPubsub2(
                      resultData.partyUId,
                      resultData.retailUnit,
                      messageId,
                      jsonData.interaction.data
                    );
                  }

                  logging.info(
                    `Submitted message #${msgCounter} with id ${messageId} and partyUid ${
                      resultData.partyUId
                    } from retailUnit ${resultData.retailUnit} and consumer ${
                      resultData.consumer
                    } for operation ${resultData.operation.toUpperCase()} to api gateway.`
                  );

                  res.status(200).send();
                })
                .catch(err => {
                  logging.error(
                    `Error occured while processing message #${msgCounter} with id ${messageId} and partyUid ${
                      resultData.partyUId
                    } from retailUnit ${resultData.retailUnit} and consumer ${
                      resultData.consumer
                    } for operation ${resultData.operation.toUpperCase()} to api gateway.`,
                    err
                  );
                  res.status(200).send(err);
                });
            }
          } else {
            //don't make call to customer api, just wait 500 ms and return OK
            setTimeout(() => {
              logging.info(
                `Processed ${resultData.operation.toLowerCase()} message ${messageId} : ${JSON.stringify(
                  message
                )}`
              );
              res.status(200).send();
            }, 500);
          }
        } else {
          //message data is bad
          logging.error(
            `Bad request/operation ${resultData.operation.toLowerCase()} message ${messageId} and partyUid ${
              resultData.partyUId
            } from retailUnit ${resultData.retailUnit} and consumer ${
              resultData.consumer
            } : ${JSON.stringify(message)}`
          );
          res.status(200).send();
          //do nothing
        }
      } else {
        /* Udaya Changes Ends for ICF-998 & ICF-2098 */
        //operation is empy,bad input?
        logging.error(
          `Bad operation or message received in message in ${messageId} with partyUid ${resultData.partyUId} from retailUnit ${resultData.retailUnit} and consumer ${resultData.consumer}`
        );
        res.status(200).send();
      }
    } catch (error) {
      logging.error(
        `Critical error in processing message ${messageId} and partyUid ${resultData.partyUId} from retailUnit ${resultData.retailUnit} and consumer ${resultData.consumer}.`,
        error
      );

      //always return 200 to PubSub or it will re-try message
      res.status(200).send();
    }
  }
);

app.get("/heartbeat", jsonBodyParser, async (req, res) => {
  try {
    let r = await heartbeat.run(configObj);
    res.setHeader("Content-Type", "application/json");

    if (JSON.stringify(r).includes("FAIL")) {
      logging.warn("--Heartbeat FAILED--", r);
      res.status(500).send(r);
    } else {
      logging.info("--Heartbeat OK--");
      res.status(200).send(r);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/*
app.get("/_ah/start", jsonBodyParser, async (req, res) => {
  if (readyToRock === false) {
    setup().then(() => {
      readyToRock = true;
      res.status(200).send();
    });
  } else {
    res.status(200).send();
  }
});
*/

// Add the error logger after all middleware and routes so that
// it can log errors from the whole application. Any custom error
// handlers should go after this.
// [START errors]
//app.use(logging.errorLogger);

app.use((req, res) => {
  res.status(404).send("Not Found");
});

// Basic 404 handler
app.use((err, req, res, next) => {
  res.status(500).send(err.response || "Something broke!");
});

// Basic error handler
app.use((err, req, res) => {
  /* jshint unused:false */
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || "Something broke!");
});

//code  init all config and then to set up web server
setup()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`App listening on port ${process.env.PORT}`);
      console.log("Press Ctrl+C to quit.");
      msgCounter = 0;
    });
  })
  .catch(err => console.log("Setup failed: " + err));

function setup() {
  if (readyToRock === false) {
    return new Promise((resolve, reject) => {
      try {
        configLoader
          .SetEncryptedEnvVariables()
          .then(() => {
            readyToRock = true;
            resolve();
          })
          .catch(err => {
            logging.error("Set up method failed", err);
            reject(err);
          });
      } catch (error) {
        logging.error("Set up method failed", error);
        reject(error);
      }
    });
  }
}

module.exports = app;

"use strict";
const request = require("request");
const icmApiCall = require("request-promise");
const { v2beta3 } = require("@google-cloud/tasks");
const logging = require("./logging").errorLogger;

/* Udaya Changes Starts for ICF-998 & ICF-2098 */
/*method to call the customer create/read/update/patialupdate/subscribe/unsubscribe/delete api using standard https request */
module.exports.customerMasterApiHttp = async function(
  messageId,
  icm_api_base_url,
  operation,
  retailUnit,
  partyUId,
  sourceSystem,
  targetSystem,
  jsonData,
  icm_onprem_client_secret,
  icm_onprem_client_id,
  icm_onprem_apigw_key
) {
  try {
    var apiMethod = null;
    var apiUrl = null;
    if (operation.toLowerCase() == "create") {
      apiUrl = icm_api_base_url + "profile/" + retailUnit.toLowerCase();
      apiMethod = "POST";
    } else if (operation.toLowerCase() == "find") {
      apiUrl = icm_api_base_url + "find/" + retailUnit.toLowerCase();
      apiMethod = "POST";
    } else if (operation.toLowerCase() == "read") {
      apiUrl =
        icm_api_base_url +
        "profile/" +
        retailUnit.toLowerCase() +
        "/" +
        partyUId;
      apiMethod = "GET";
    } else if (operation.toLowerCase() == "update") {
      apiUrl =
        icm_api_base_url +
        "profile/" +
        retailUnit.toLowerCase() +
        "/" +
        partyUId;
      apiMethod = "PUT";
    } else if (operation.toLowerCase() == "partialupdate") {
      apiUrl =
        icm_api_base_url +
        "profile/partialUpdate/" +
        retailUnit.toLowerCase() +
        "/" +
        partyUId;
      apiMethod = "PUT";
    } else if (operation.toLowerCase() == "delete") {
      apiUrl =
        icm_api_base_url +
        "profile/" +
        retailUnit.toUpperCase() +
        "/" +
        partyUId;
      apiMethod = "DELETE";
    } else if (
      operation.toLowerCase() == "subscribe" ||
      operation.toLowerCase() == "unsubscribe"
    ) {
      apiUrl =
        icm_api_base_url + "subscribe-unsubscribe/" + retailUnit.toLowerCase();
      apiMethod = "POST";
    } else {
      throw "Unsupported Customer Master API Operation " +
        (operation.toLowerCase() || "null");
    }
    let customer = {};
    let request = {};

    const icmBasicAuth =
      "Basic " +
      Buffer.from(
        process.env.icm_onprem_service_account_name +
          ":" +
          process.env.icm_onprem_service_account_password
      ).toString("base64");
    customer.partyUId = partyUId;
    request = {
      url: apiUrl,
      method: apiMethod,
      json: true,
      body: jsonData,
      headers: {
        "cache-control": "no-cache",
        "Content-Type": "application/json; charset=UTF-8",
        "unique-rq-id": messageId,
        "x-ibm-client-secret": icm_onprem_client_secret,
        "x-ibm-client-id": icm_onprem_client_id,
        "X-Icfinteg-Key": icm_onprem_apigw_key,
        Authorization: icmBasicAuth,
        targetSystem: targetSystem
      },
      gzip: true
    };
    await icmApiCall(request)
      .then(body => {
        var errFlag = true;
        try {
          if (
            (operation.toLowerCase() == "create" ||
              operation.toLowerCase() == "update" ||
              operation.toLowerCase() == "find" ||
              operation.toLowerCase() == "read") &&
            body
          ) {
            if (body.customers[0].partyUId || body.customer.partyUId) {
              errFlag = false;
            }
          } else if (
            (operation.toLowerCase() == "partialupdate" ||
              operation.toLowerCase() == "delete") &&
            !body
          ) {
            errFlag = false;
          } else if (
            (operation.toLowerCase() == "subscribe" ||
              operation.toLowerCase() == "unsubscribe") &&
            body
          ) {
            if (body.output) {
              errFlag = false;
            }
          }
        } catch (e) {
          errFlag = true;
        }
        if (!errFlag) {
          if (body) {
            if (body.customers) {
              customer = body.customers ? body.customers[0] : customer;
            } else if (body.customer) {
              customer = body.customer;
            }
          }
          logging.info(
            `Sucessfully called API gatewway over https for ${operation.toLowerCase()} partyUId: ${partyUId} part of retailUnit ${retailUnit}`
          );
        } else {
          logging.error(
            "Message Id: " +
              messageId +
              " Error in icmApiCall while processing the Response"
          );
          throw JSON.stringify(body);
        }
      })
      .catch(err => {
        logging.error(
          "Message Id: " +
            messageId +
            " Error in customerMasterApiHttp while processing. Error: " +
            err
        );
        throw err;
      });
    return customer;
  } catch (error) {
    logging.error(
      "Message Id: " +
        messageId +
        " Error in customerMasterApiHttp while processing. Error: " +
        error
    );

    throw "API call exception occurred in customerMasterApiHttp for MessageId: " +
      messageId +
      " ==> " +
      error;
  }
};
/*method to call the customer create/read/update/patialupdate/subscribe/unsubscribe/delete api using cloud tasks */
module.exports.customerMasterApiCloudTask = async function(
  messageId,
  icm_api_base_url,
  operation,
  retailUnit,
  partyUId,
  sourceSystem,
  targetSystem,
  jsonData,
  projectId,
  location,
  queueName,
  icm_onprem_client_secret,
  icm_onprem_client_id,
  icm_onprem_apigw_key,
  icm_opneprem_basic_authorization,
  inSeconds
) {
  try {
    var apiMethod = null;
    var apiUrl = null;
    if (operation.toLowerCase() == "create") {
      apiUrl = icm_api_base_url + "profile/" + retailUnit.toLowerCase();
      apiMethod = "POST";
    } else if (operation.toLowerCase() == "update") {
      apiUrl =
        icm_api_base_url +
        "profile/" +
        retailUnit.toLowerCase() +
        "/" +
        partyUId;
      apiMethod = "PUT";
    } else if (operation.toLowerCase() == "partialupdate") {
      apiUrl =
        icm_api_base_url +
        "profile/partialUpdate/" +
        retailUnit.toLowerCase() +
        "/" +
        partyUId;
      apiMethod = "PUT";
    } else if (operation.toLowerCase() == "delete") {
      apiUrl =
        icm_api_base_url +
        "profile/" +
        retailUnit.toUpperCase() +
        "/" +
        partyUId;
      apiMethod = "DELETE";
    } else if (
      operation.toLowerCase() == "subscribe" ||
      operation.toLowerCase() == "unsubscribe"
    ) {
      apiUrl =
        icm_api_base_url + "subscribe-unsubscribe/" + retailUnit.toLowerCase();
      apiMethod = "POST";
    } else {
      throw "Unsupported Customer Master API Operation " +
        (operation.toLowerCase() || "null");
    }
    const client = new v2beta3.CloudTasksClient();
    const parent = client.queuePath(projectId, location, queueName);
    const icmBasicAuth =
      "Basic " +
      Buffer.from(
        process.env.icm_onprem_service_account_name +
          ":" +
          process.env.icm_onprem_service_account_password
      ).toString("base64");

    const headers = {
      "cache-control": "no-cache",
      "Content-Type": "application/json; charset=UTF-8",
      "unique-rq-id": messageId,
      "x-ibm-client-secret": icm_onprem_client_secret,
      "x-ibm-client-id": icm_onprem_client_id,
      "X-Icfinteg-Key": icm_onprem_apigw_key,
      Authorization: icmBasicAuth,
      targetSystem: targetSystem
    };
    const task = {
      httpRequest: {
        httpMethod: apiMethod,
        url: apiUrl,
        headers
      }
    };

    if (jsonData) {
      task.httpRequest.body = Buffer.from(JSON.stringify(jsonData)).toString(
        "base64"
      );
    }

    if (inSeconds) {
      // The time when the task is scheduled to be attempted.
      task.scheduleTime = {
        seconds: inSeconds + Date.now() / 1000
      };
    }
    const request = {
      parent: parent,
      task: task
    };

    const [response] = await client.createTask(request);
    const name = response.name;

    logging.info(
      `Created cloud task ${name} for ${operation.toLowerCase()} partyUId: ${partyUId} part of retailUnit ${retailUnit}`
    );
    return response;
  } catch (error) {
    logging.error(
      `Cloud task API call exception occurred in customerMasterApiCloudTask for message ${messageId} with operation ${operation.toLowerCase()} partyUId: ${partyUId} part of retailUnit ${retailUnit}`,
      error
    );

    logging.error(JSON.stringify(request));

    throw "Cloud task API call exception occurred in customerMasterApiCloudTask: " +
      messageId +
      " ==> " +
      error;
  }
};
/* Udaya Changes Ends for ICF-998 & ICF-2098 */

//generate a random string that can be used for testing
module.exports.getRandomString = function() {
  try {
    var randomString =
      Math.random()
        .toString(36)
        .substring(2, 15) +
      Math.random()
        .toString(36)
        .substring(2, 15);

    return randomString;
  } catch (error) {
    logging.error("Expection occured in getRandomString: " + error.stack);
    throw error;
  }
};
//update an adress with a random string and set update date/time to now()
module.exports.customerMasterSetNewAdressAndDate = function(
  resultData,
  newAdressValue
) {
  var newDate = new Date();
  try {
    var jsonData = JSON.parse(resultData);
    jsonData.update.customer.updated = newDate.toISOString();
    jsonData.update.customer.addresses[0].updated = newDate.toISOString();

    if (newAdressValue) {
      jsonData.update.customer.addresses[0].streetAddress1 = newAdressValue;
    }

    return JSON.stringify(jsonData);
  } catch (error) {
    logging.error(
      "Expection occured in customerMasterSetNewAdressAndDate: " + error.stack
    );
    throw "Expection occured in customerMasterSetNewAdressAndDate";
  }
};
// get token for auth from CIAM
module.exports.getIcmToken = async function(
  tokenUrl,
  findClientId,
  findClientSecret,
  findAudience,
  findGrantType
) {
  return new Promise((resolve, reject) => {
    request(
      {
        url: tokenUrl,
        method: "POST",
        json: true,
        body: {
          grant_type: findGrantType,
          client_id: findClientId,
          client_secret: findClientSecret,
          audience: findAudience
        }
      },
      function(error, response, body) {
        if (!error && response.statusCode === 200) {
          resolve(body.access_token);
        } else if (response.statusCode !== 200) {
          logging.error("lookup.getToken() Error." + JSON.stringify(response));
          reject(new Error("getToken: There was an error"));
        } else if (error) {
          logging.error("lookup.getToken() Error." + JSON.stringify(error));
          reject(new Error("getToken: There was"));
        }
      }
    );
  });
};
// get uid based on xyz partyUId
module.exports.getUserByPartyUId = async function(token, partyUId, findUrl) {
  return new Promise((resolve, reject) => {
    try {
      if (token != null) {
        let bearerToken = "Bearer " + token;
        request(
          {
            url: findUrl,
            method: "POST",
            json: true,
            headers: { Authorization: bearerToken, "cname-api-key": "HELLO" },
            body: {
              find: {
                findMeta: {
                  consumer: "IPOS",
                  resultSet: "FULL",
                  pageSize: 10,
                  customerType: "Individual"
                },
                exactMatch: { status: "Active", partyUId: partyUId }
              }
            }
          },
          function(error, response, body) {
            if (!error && response.statusCode === 200 && !body.errorCode) {
              if (body.customers[0]) {
                resolve(body.customers[0]);
              }
            } else {
              resolve("MISSING");
            }
          }
        );
      }
    } catch (err) {
      logging.error(err);
      reject(err);
    }
  });
};
// get uid based on xyz family number
module.exports.getUserByFamiliyCard = async function(token, cardId, findUrl) {
  return new Promise((resolve, reject) => {
    try {
      if (token != null) {
        let bearerToken = "Bearer " + token;
        request(
          {
            url: findUrl,
            method: "POST",
            json: true,
            headers: { Authorization: bearerToken, "cname-api-key": "HELLO" },
            body: {
              find: {
                findMeta: {
                  consumer: "IPOS",
                  resultSet: "FULL",
                  pageSize: 10,
                  customerType: "Individual"
                },
                exactMatch: { status: "Active", cardNumber: cardId }
              }
            }
          },
          function(error, response, body) {
            if (!error && response.statusCode === 200 && !body.errorCode) {
              if (body.customers[0]) {
                resolve(body.customers[0]);
              }
            } else {
              resolve("MISSING");
            }
          }
        );
      }
    } catch (err) {
      logging.error(err);
      reject(err);
    }
  });
};
//gets all cloud task queues
module.exports.getCloudRunQueues = async function(
  project = "my-project-id", // Your GCP Project id
  location = "us-central1" // The GCP region to search for queues
) {
  // Imports the Google Cloud Tasks library.
  const cloudTasks = require("@google-cloud/tasks");
  // Instantiates a client.
  const client = new cloudTasks.CloudTasksClient();
  // Get the fully qualified path to the region
  const parent = client.locationPath(project, location);
  // list all fo the queues
  const [queues] = await client.listQueues({ parent });
  return queues;
};

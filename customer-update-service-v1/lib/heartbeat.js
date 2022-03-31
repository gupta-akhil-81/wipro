var pubSub = require("../lib/pubSubCaller");
const api = require("../lib/cmApiCaller");
const logging = require("./logging").errorLogger;
const msgId = 589285969581876;
const sourceSystem = "icmc";
const targetSystem = "icm";
const retailUnit = "BE";
const partyUId = "28928A1C-6838-11e9-826C-005056995894";

module.exports.run = async configObj => {
  try {
    //let [pubSub, cloudTask, readTask, findTask] = await Promise.all([
    let [pubSub, cloudTask] = await Promise.all([
      this.checkPubSubConnection(configObj),
      this.checkCloudTaskQueue(configObj)
      /*
      //this.checkApiGwyRead(
        configObj,
        retailUnit,
        partyUId,
        sourceSystem,
        targetSystem
      ),
      //this.checkApiGwyFind(
        configObj,
        retailUnit,
        "firstName",
        "Jean",
        sourceSystem,
        targetSystem
      )
      */
    ]);

    let resultJason = JSON.parse('{"heartbeats":[]}');
    resultJason.heartbeats.push(pubSub);
    resultJason.heartbeats.push(cloudTask);
    //resultJason.heartbeats.push(readTask);
    //resultJason.heartbeats.push(findTask);

    return resultJason;
  } catch (error) {
    logging.error("Heartbeat failed or had issues", error.stack);
  }
};
module.exports.checkPubSubConnection = async function(configObj) {
  let result = false;
  let okObj = '{"PubSub": "OK"}';
  let failObj = '{"PubSub": "FAIL"}';

  return new Promise(function(resolve, reject) {
    try {
      var subscriptionName = `projects/${configObj.projectId}/subscriptions/${configObj.pubsub_subscription}`;

      pubSub
        .getSubscription(subscriptionName)
        .then(metadata => {
          if (metadata.name == subscriptionName) {
            result = true;
          } else {
            result = false;
          }
        })
        .then(() => {
          if (result == true) {
            resolve(okObj);
          } else {
            reject(failObj);
          }
        })
        .catch(error => {
          logging.error(
            "PubSub connection failed in checkPubSubConnection: ",
            error.stack
          );
          reject(failObj);
        });
    } catch (error) {
      logging.error(
        "PubSub connection failed in checkPubSubConnection: ",
        error.stack
      );
      reject(failObj);
    }
  });
};

module.exports.checkCloudTaskQueue = async function(configObj) {
  let okObj = '{"CloudTaskQ": "OK"}';
  let failObj = '{"CloudTaskQ": "FAIL"}';

  return new Promise(function(resolve, reject) {
    let qNameToGet = `projects/${configObj.projectId}/locations/${configObj.cloud_task_location}/queues/${configObj.cloud_task_queue_name}`;

    api
      .getCloudRunQueues(configObj.projectId, configObj.cloud_task_location)
      .then(queues => {
        let foundQ = false;
        let countQ = queues.length;
        for (let i = 0; i < countQ; i++) {
          let q = queues[i];
          if (q.name == qNameToGet) {
            foundQ = true;
            break;
          }
        }
        if (foundQ) {
          resolve(okObj);
        } else {
          logging.info("CloudTask connection failed in checkCloudTaskQueue");
          reject(failObj);
        }
      })
      .catch(error => {
        logging.error(
          "CloudTask connection failed in checkCloudTaskQueue",
          error.stack
        );
        reject(failObj);
      });
  });
};

module.exports.checkApiGwyRead = async function(
  configObj,
  retailUnit,
  partyUId,
  sourceSystem,
  targetSystem
) {
  let okObj = '{"ApiGwyRead": "OK"}';
  let failObj = '{"ApiGwyRead": "FAIL"}';

  return new Promise(function(resolve, reject) {
    api
      .customerMasterApiHttp(
        msgId,
        configObj.icm_api_base_url,
        "read",
        retailUnit,
        partyUId,
        sourceSystem,
        targetSystem,
        "",
        process.env.icm_onprem_client_secret,
        process.env.icm_onprem_client_id,
        process.env.icm_onprem_apigw_key
      )
      .then(cust => {
        if (cust) {
          if (partyUId == cust.partyUId) {
            resolve(okObj);
          } else {
            reject(okObj);
          }
        }
      })
      .catch(() => {
        reject(failObj);
      });
  });
};

module.exports.checkApiGwyFind = async function(
  configObj,
  retailUnit,
  findField,
  findValue,
  sourceSystem,
  targetSystem
) {
  let okObj = '{"ApiGwyFind": "OK"}';
  let failObj = '{"ApiGwyFind": "FAIL"}';

  return new Promise(function(resolve, reject) {
    try {
      module.exports
        .getApiGwyFind(
          configObj,
          retailUnit,
          findField,
          findValue,
          sourceSystem,
          targetSystem
        )
        .then(cust => {
          if (cust) {
            resolve(okObj);
          } else {
            reject(failObj);
          }
        })
        .catch(() => {
          reject(failObj);
        });
    } catch (err) {
      reject(failObj);
    }
  });
};

module.exports.getApiGwyFind = async function getApiGwyFind(
  configObj,
  retailUnit,
  findField,
  findValue,
  sourceSystem,
  targetSystem
) {
  return new Promise(function(resolve, reject) {
    let jsonData = {
      find: {
        findMeta: {
          consumer: sourceSystem,
          customerType: "Individual",
          pageSize: 1,
          resultSet: "FULL"
        },
        exactMatch: { status: "Active" }
      }
    };

    jsonData.find.exactMatch[findField] = findValue;

    try {
      api
        .customerMasterApiHttp(
          msgId,
          configObj.icm_api_base_url,
          "find",
          retailUnit,
          "",
          sourceSystem,
          targetSystem,
          jsonData,
          process.env.icm_onprem_client_secret,
          process.env.icm_onprem_client_id,
          process.env.icm_onprem_apigw_key
        )
        .then(cust => {
          if (cust) {
            resolve(cust);
          } else {
            reject();
          }
        })
        .catch(err => {
          reject(err);
        });
    } catch (err) {
      //reject(err);
    }
  });
};

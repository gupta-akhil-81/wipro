let expect = require("chai").expect;
let kms = require("../lib/decrypt");
let api = require("../lib/cmApiCaller");
let configObj;
const uuidV4 = require("uuid/v4");
let hbeat = require("../lib/heartbeat");

describe("System integration tests", function() {
  before(function(done) {
    this.enableTimeouts(false);
    const configLoader = require("../lib/envLoader");
    configLoader.SetEncryptedEnvVariables().then(() => {
      configObj = require("../lib/config");
      done();
    });
  });

  describe.skip("Integration testing of encryption and decryption ", function() {
    let cipherText = "";
    let randomString;

    it("should work to decrypt using KMS.", function(done) {
      if (configObj.test_kms_value == "TEST") {
        done();
      } else {
        done(new Error("KMS test failed."));
      }
    });

    it("should work to encrypt data/variables", function(done) {
      randomString =
        Math.random()
          .toString(36)
          .substring(2, 15) +
        Math.random()
          .toString(36)
          .substring(2, 15);

      kms
        .encryptData(
          configObj.projectId,
          configObj.keyRingId,
          configObj.keyId,
          randomString
        )
        .then(encryptedValue => {
          cipherText = encryptedValue;
          expect(cipherText).length.greaterThan(0);
        })
        .then(() => {
          done();
        })
        .catch(error => {
          done(new Error(error));
        });
    });

    it("should work to decrypt data/variables", function(done) {
      kms
        .decryptData(
          configObj.projectId,
          configObj.keyRingId,
          configObj.keyId,
          cipherText
        )
        .then(plaintext => {
          expect(randomString).equal(plaintext);
        })
        .then(() => {
          done();
        })
        .catch(error => {
          done(new Error(error));
        });
    });
  });

  describe.skip("Integration testing of Pub/Sub", function() {
    it("should work to connect to the pub/sub topic", function(done) {
      let r = hbeat.checkPubSubConnection(configObj);
      r.then(result => {
        expect(result).contains("OK");
      })
        .then(() => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe.skip("Integration testing of Cloud tasks", function() {
    it("should work to connect to the cloud run queue", function(done) {
      let r = hbeat.checkCloudTaskQueue(configObj);
      r.then(result => {
        expect(result).contains("OK");
      })
        .then(() => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  /* Udaya Changes Starts for ICF-2098 & ICF-998 */
  describe("ICM Customer Sync API tests using https method", function() {
    const msgId = uuidV4();
    const sleep = milliseconds => {
      return new Promise(resolve => setTimeout(resolve, milliseconds));
    };
    let partyUId = null;
    let retailUnit = null;
    let message = {};
    let customer = {};

    it("should work to create a customer using the https api method", function(done) {
      let jsonData = require("./payload_samples/api-pubsub-cm-create-customer-sample.json");
      let customerMsg = JSON.parse(
        Buffer.from(jsonData.message.data, "base64")
      );
      customerMsg.create.createMeta.sourceInternalId = msgId;
      jsonData.message.attributes.partyUId =
        customerMsg.create.createMeta.sourceInternalId;
      customerMsg.create.customer.partyUId =
        jsonData.message.attributes.partyUId;
      partyUId = jsonData.message.attributes.partyUId;
      retailUnit = jsonData.message.attributes.retailUnit;
      jsonData.message.attributes.publishTime = new Date().toISOString();
      customerMsg.create.customer.updated =
        jsonData.message.attributes.publishTime;
      message = jsonData.message;
      api
        .customerMasterApiHttp(
          msgId,
          configObj.icm_api_base_url,
          jsonData.message.attributes.operation.toLowerCase(),
          jsonData.message.attributes.retailUnit,
          jsonData.message.attributes.partyUId,
          jsonData.message.attributes.sourceSystem,
          jsonData.message.attributes.targetSystem,
          customerMsg,
          configObj.icm_onprem_client_secret,
          configObj.icm_onprem_client_id,
          configObj.icm_onprem_apigw_key
        )
        .then(cust => {
          if (cust) {
            customer = cust;
            partyUId = customer.partyUId;
          }
          expect(partyUId).is.not.null;
          done();
        })
        .catch(err => {
          done(
            new Error(
              `Error occurred during processing message ${msgId} to api gateway: ${err}`
            )
          );
        });
    });

    it("should work to update a customer using the https api method", function(done) {
      let jsonData = require("./payload_samples/api-pubsub-cm-update-customer-sample.json");
      let customerMsg = JSON.parse(
        Buffer.from(jsonData.message.data, "base64")
      );
      customerMsg.update.updateMeta.sourceInternalId = msgId;
      jsonData.message.attributes.partyUId =
        partyUId || customerMsg.update.updateMeta.sourceInternalId;
      jsonData.message.attributes.retailUnit =
        retailUnit || jsonData.message.attributes.retailUnit;
      customerMsg.update.customer.updated = new Date().toISOString();
      jsonData.message.attributes.publishTime =
        customerMsg.update.customer.updated;
      api
        .customerMasterApiHttp(
          msgId,
          configObj.icm_api_base_url,
          jsonData.message.attributes.operation.toLowerCase(),
          jsonData.message.attributes.retailUnit,
          jsonData.message.attributes.partyUId,
          jsonData.message.attributes.sourceSystem,
          jsonData.message.attributes.targetSystem,
          customerMsg,
          configObj.icm_onprem_client_secret,
          configObj.icm_onprem_client_id,
          configObj.icm_onprem_apigw_key
        )
        .then(cust => {
          if (cust) {
            customer = cust;
            partyUId = customer.partyUId;
          }
          expect(customer.socialSecurityNumber).to.equal(
            customerMsg.update.customer.socialSecurityNumber
          );
          done();
        })
        .catch(err => {
          done(
            new Error(
              `Error occurred during processing message ${msgId} to api gateway: ${err}`
            )
          );
        });
    });

    it("should work to read a customer using the https api method", function(done) {
      message.attributes.operation = "read";
      message.attributes.partyUId = partyUId;
      message.attributes.publishTime = new Date().toISOString();
      sleep(20000).then(() => {
        api
          .customerMasterApiHttp(
            msgId,
            configObj.icm_api_base_url,
            message.attributes.operation.toLowerCase(),
            message.attributes.retailUnit,
            message.attributes.partyUId,
            message.attributes.sourceSystem,
            message.attributes.targetSystem,
            "",
            configObj.icm_onprem_client_secret,
            configObj.icm_onprem_client_id,
            configObj.icm_onprem_apigw_key
          )
          .then(cust => {
            if (cust) {
              customer = cust;
              partyUId = customer.partyUId;
            }
            expect(customer.partyUId).is.eq(partyUId);
            done();
          })
          .catch(err => {
            done(
              new Error(
                `Error occurred during processing message ${msgId} to api gateway: ${err}`
              )
            );
          });
      });
    });

    it("should work to patialUpdate a customer using the https api method", function(done) {
      let jsonData = require("./payload_samples/api-pubsub-cm-partialupdate-address-sample.json");
      let customerMsg = JSON.parse(
        Buffer.from(jsonData.message.data, "base64")
      );
      customerMsg.update.partialUpdateMeta.sourceInternalId = msgId;
      jsonData.message.attributes.partyUId =
        partyUId || customerMsg.update.partialUpdateMeta.sourceInternalId;
      jsonData.message.attributes.retailUnit =
        retailUnit || jsonData.message.attributes.retailUnit;
      customerMsg.update.customer.partyUId =
        jsonData.message.attributes.partyUId;
      customerMsg.update.customer.updated = new Date().toISOString();
      customerMsg.update.customer.addresses[0].updated =
        customerMsg.update.customer.updated;
      jsonData.message.attributes.publishTime =
        customerMsg.update.customer.updated;
      customer = customerMsg.update.customer;
      api
        .customerMasterApiHttp(
          msgId,
          configObj.icm_api_base_url,
          jsonData.message.attributes.operation.toLowerCase(),
          jsonData.message.attributes.retailUnit,
          jsonData.message.attributes.partyUId,
          jsonData.message.attributes.sourceSystem,
          jsonData.message.attributes.targetSystem,
          customerMsg,
          configObj.icm_onprem_client_secret,
          configObj.icm_onprem_client_id,
          configObj.icm_onprem_apigw_key
        )
        .then(() => {
          done();
        })
        .catch(err => {
          done(
            new Error(
              `Error occurred during processing message ${msgId} to api gateway: ${err}`
            )
          );
        });
    });

    it("should work to find a customer using the https api method", function(done) {
      message.attributes.operation = "find";
      message.attributes.partyUId = partyUId;
      let jsonData = {
        find: {
          findMeta: {
            consumer: message.attributes.sourceSystem,
            customerType: customer.customerType,
            pageSize: 1,
            resultSet: "FULL"
          },
          exactMatch: { status: customer.status, partyUId: partyUId }
        }
      };
      message.attributes.publishTime = new Date().toISOString();
      sleep(20000).then(() => {
        api
          .customerMasterApiHttp(
            msgId,
            configObj.icm_api_base_url,
            message.attributes.operation.toLowerCase(),
            message.attributes.retailUnit,
            message.attributes.partyUId,
            message.attributes.sourceSystem,
            message.attributes.targetSystem,
            jsonData,
            configObj.icm_onprem_client_secret,
            configObj.icm_onprem_client_id,
            configObj.icm_onprem_apigw_key
          )
          .then(cust => {
            if (cust) {
              expect(cust.addresses[0].streetAddress1).to.equal(
                customer.addresses[0].streetAddress1
              );
              customer = cust;
              partyUId = customer.partyUId;
            }
            done();
          })
          .catch(err => {
            done(
              new Error(
                `Error occurred during processing message ${msgId} to api gateway: ${err}`
              )
            );
          });
      });
    });

    it("should work to Subscribe a customer using the https api method", function(done) {
      let jsonData = require("./payload_samples/api-pubsub-cm-subscribe-customer-sample.json");
      let customerMsg = JSON.parse(
        Buffer.from(jsonData.message.data, "base64")
      );
      customerMsg.input.operationMeta.sourceInternalId = msgId;
      jsonData.message.attributes.partyUId =
        partyUId || customerMsg.input.operationMeta.sourceInternalId;
      jsonData.message.attributes.retailUnit =
        retailUnit || jsonData.message.attributes.retailUnit;
      customerMsg.input.account[0].externalSystemRefId =
        customerMsg.input.operationMeta.sourceInternalId;
      customerMsg.input.account[0].partyUId =
        jsonData.message.attributes.partyUId;
      jsonData.message.attributes.publishTime = new Date().toISOString();
      api
        .customerMasterApiHttp(
          msgId,
          configObj.icm_api_base_url,
          jsonData.message.attributes.operation.toLowerCase(),
          jsonData.message.attributes.retailUnit,
          jsonData.message.attributes.partyUId,
          jsonData.message.attributes.sourceSystem,
          jsonData.message.attributes.targetSystem,
          customerMsg,
          configObj.icm_onprem_client_secret,
          configObj.icm_onprem_client_id,
          configObj.icm_onprem_apigw_key
        )
        .then(() => {
          done();
        })
        .catch(err => {
          done(
            new Error(
              `Error occurred during processing message ${msgId} to api gateway: ${err}`
            )
          );
        });
    });

    it("should work to Unsubscribe a customer using the https api method", function(done) {
      let jsonData = require("./payload_samples/api-pubsub-cm-unsubscribe-customer-sample.json");
      let customerMsg = JSON.parse(
        Buffer.from(jsonData.message.data, "base64")
      );
      customerMsg.input.operationMeta.sourceInternalId = msgId + 1;
      jsonData.message.attributes.partyUId =
        partyUId || customerMsg.input.operationMeta.sourceInternalId;
      jsonData.message.attributes.retailUnit =
        retailUnit || jsonData.message.attributes.retailUnit;
      customerMsg.input.account[0].externalSystemRefId =
        customerMsg.input.operationMeta.sourceInternalId;
      customerMsg.input.account[0].partyUId =
        jsonData.message.attributes.partyUId;
      jsonData.message.attributes.publishTime = new Date().toISOString();
      api
        .customerMasterApiHttp(
          msgId,
          configObj.icm_api_base_url,
          jsonData.message.attributes.operation.toLowerCase(),
          jsonData.message.attributes.retailUnit,
          jsonData.message.attributes.partyUId,
          jsonData.message.attributes.sourceSystem,
          jsonData.message.attributes.targetSystem,
          customerMsg,
          configObj.icm_onprem_client_secret,
          configObj.icm_onprem_client_id,
          configObj.icm_onprem_apigw_key
        )
        .then(() => {
          done();
        })
        .catch(err => {
          done(
            new Error(
              `Error occurred during processing message ${msgId} to api gateway: ${err}`
            )
          );
        });
    });

    it("should work to delete a customer using the https api method", function(done) {
      let jsonData = require("./payload_samples/api-pubsub-cm-delete-customer-sample.json");
      let customerMsg = JSON.parse(
        Buffer.from(jsonData.message.data, "base64")
      );
      customerMsg.delete.deleteMeta.sourceInternalId = msgId + 1;
      jsonData.message.attributes.partyUId =
        partyUId || customerMsg.delete.deleteMeta.sourceInternalId;
      jsonData.message.attributes.retailUnit =
        retailUnit || jsonData.message.attributes.retailUnit;
      message.attributes.publishTime = new Date().toISOString();
      try {
        api
          .customerMasterApiHttp(
            msgId,
            configObj.icm_api_base_url,
            jsonData.message.attributes.operation.toLowerCase(),
            jsonData.message.attributes.retailUnit,
            jsonData.message.attributes.partyUId,
            jsonData.message.attributes.sourceSystem,
            jsonData.message.attributes.targetSystem,
            customerMsg,
            configObj.icm_onprem_client_secret,
            configObj.icm_onprem_client_id,
            configObj.icm_onprem_apigw_key
          )
          .then(() => {
            done();
          });
      } catch (err) {
        done();
      }
    });

    describe("ICM Customer Sync API tests using cloud task queue", function() {
      const msgId = uuidV4();
      var now = new Date();
      const ssnTicks = now.getTime() * 10000 + 621355968000000000;
      const sleep = milliseconds => {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
      };
      let partyUId = null;
      let retailUnit = null;
      let message = {};
      let customer = {};
      let payLoad = {};

      it("should work to create a customer using the cloud task queue", function(done) {
        let jsonData = require("./payload_samples/api-pubsub-cm-create-customer-sample.json");
        let customerMsg = JSON.parse(
          Buffer.from(jsonData.message.data, "base64")
        );
        customerMsg.create.createMeta.sourceInternalId = msgId;
        jsonData.message.attributes.partyUId =
          customerMsg.create.createMeta.sourceInternalId;
        customerMsg.create.customer.partyUId =
          jsonData.message.attributes.partyUId;

        //needs to be random in the future
        customerMsg.create.customer.socialSecurityNumber = ssnTicks.toString();
        partyUId = jsonData.message.attributes.partyUId;
        retailUnit = jsonData.message.attributes.retailUnit;
        jsonData.message.attributes.publishTime = new Date().toISOString();

        customerMsg.create.customer.updated =
          jsonData.message.attributes.publishTime;

        message = jsonData.message;
        payLoad = customerMsg;

        api
          .customerMasterApiCloudTask(
            msgId,
            configObj.icm_api_base_url,
            //jsonData.message.attributes.operation.toLowerCase(),
            "create",
            jsonData.message.attributes.retailUnit,
            jsonData.message.attributes.partyUId,
            jsonData.message.attributes.sourceSystem,
            jsonData.message.attributes.targetSystem,
            customerMsg,
            configObj.projectId,
            configObj.cloud_task_location,
            configObj.cloud_task_queue,
            configObj.icm_onprem_client_secret,
            configObj.icm_onprem_client_id,
            configObj.icm_onprem_apigw_key,
            1
          )
          .then(
            sleep(10000)
              .then(() => {
                let r = hbeat.getApiGwyFind(
                  configObj,
                  jsonData.message.attributes.retailUnit,
                  "socialSecurityNumber",
                  customerMsg.create.customer.socialSecurityNumber,
                  jsonData.message.attributes.sourceSystem,
                  jsonData.message.attributes.targetSystem
                );
                r.then(cust => {
                  if (cust) {
                    customer = cust;
                    partyUId = cust.partyUId;
                  }
                })
                  .then(() => {
                    expect;
                    done();
                  })
                  .catch(error => {
                    done(error);
                  });
              })
              .catch(err => {
                done(
                  new Error(
                    `Error occurred during processing message ${msgId} to api gateway: ${err}`
                  )
                );
              })
          );
      });

      it("should work to update a customer using the cloud task queue", function(done) {
        let jsonData = require("./payload_samples/api-pubsub-cm-update-customer-sample.json");
        let customerMsg = JSON.parse(
          Buffer.from(jsonData.message.data, "base64")
        );
        customerMsg.update.updateMeta.sourceInternalId = msgId;
        jsonData.message.attributes.partyUId =
          partyUId || customerMsg.update.updateMeta.sourceInternalId;
        jsonData.message.attributes.retailUnit =
          retailUnit || jsonData.message.attributes.retailUnit;
        customerMsg.update.customer.updated = new Date().toISOString();
        jsonData.message.attributes.publishTime =
          customerMsg.update.customer.updated;
        api
          .customerMasterApiCloudTask(
            msgId,
            configObj.icm_api_base_url,
            jsonData.message.attributes.operation.toLowerCase(),
            jsonData.message.attributes.retailUnit,
            jsonData.message.attributes.partyUId,
            jsonData.message.attributes.sourceSystem,
            jsonData.message.attributes.targetSystem,
            customerMsg,
            configObj.projectId,
            configObj.cloud_task_location,
            configObj.cloud_task_queue,
            configObj.icm_onprem_client_secret,
            configObj.icm_onprem_client_id,
            configObj.icm_onprem_apigw_key,
            10
          )
          .then(() => {
            done();
          })
          .catch(err => {
            done(
              new Error(
                `Error occurred during processing message ${msgId} to api gateway: ${err}`
              )
            );
          });
      });

      it("should work to patialUpdate a customer using the cloud task queue", function(done) {
        let jsonData = require("./payload_samples/api-pubsub-cm-partialupdate-address-sample.json");
        let customerMsg = JSON.parse(
          Buffer.from(jsonData.message.data, "base64")
        );
        customerMsg.update.partialUpdateMeta.sourceInternalId = msgId;

        jsonData.message.attributes.partyUId =
          partyUId || customerMsg.update.partialUpdateMeta.sourceInternalId;

        jsonData.message.attributes.retailUnit =
          retailUnit || jsonData.message.attributes.retailUnit;

        customerMsg.update.customer.partyUId =
          jsonData.message.attributes.partyUId;
        customerMsg.update.customer.updated = new Date().toISOString();
        customerMsg.update.customer.addresses[0].updated =
          customerMsg.update.customer.updated;
        jsonData.message.attributes.publishTime =
          customerMsg.update.customer.updated;
        api
          .customerMasterApiCloudTask(
            msgId,
            configObj.icm_api_base_url,
            jsonData.message.attributes.operation.toLowerCase(),
            jsonData.message.attributes.retailUnit,
            jsonData.message.attributes.partyUId,
            jsonData.message.attributes.sourceSystem,
            jsonData.message.attributes.targetSystem,
            customerMsg,
            configObj.projectId,
            configObj.cloud_task_location,
            configObj.cloud_task_queue,
            configObj.icm_onprem_client_secret,
            configObj.icm_onprem_client_id,
            configObj.icm_onprem_apigw_key,
            20
          )
          .then(() => {
            done();
          })
          .catch(err => {
            done(
              new Error(
                `Error occurred during processing message ${msgId} to api gateway: ${err}`
              )
            );
          });
      });

      it("should work to Subscribe a customer using the cloud task queue", function(done) {
        let jsonData = require("./payload_samples/api-pubsub-cm-subscribe-customer-sample.json");
        let customerMsg = JSON.parse(
          Buffer.from(jsonData.message.data, "base64")
        );
        customerMsg.input.operationMeta.sourceInternalId = msgId;
        jsonData.message.attributes.partyUId =
          partyUId || customerMsg.input.operationMeta.sourceInternalId;
        jsonData.message.attributes.retailUnit =
          retailUnit || jsonData.message.attributes.retailUnit;
        customerMsg.input.account[0].externalSystemRefId =
          customerMsg.input.operationMeta.sourceInternalId;
        customerMsg.input.account[0].partyUId =
          jsonData.message.attributes.partyUId;
        jsonData.message.attributes.publishTime = new Date().toISOString();
        api
          .customerMasterApiCloudTask(
            msgId,
            configObj.icm_api_base_url,
            jsonData.message.attributes.operation.toLowerCase(),
            jsonData.message.attributes.retailUnit,
            jsonData.message.attributes.partyUId,
            jsonData.message.attributes.sourceSystem,
            jsonData.message.attributes.targetSystem,
            customerMsg,
            configObj.projectId,
            configObj.cloud_task_location,
            configObj.cloud_task_queue,
            configObj.icm_onprem_client_secret,
            configObj.icm_onprem_client_id,
            configObj.icm_onprem_apigw_key,
            30
          )
          .then(() => {
            done();
          })
          .catch(err => {
            done(
              new Error(
                `Error occurred during processing message ${msgId} to api gateway: ${err}`
              )
            );
          });
      });

      it("should work to Unsubscribe a customer using the cloud task queue", function(done) {
        let jsonData = require("./payload_samples/api-pubsub-cm-unsubscribe-customer-sample.json");
        let customerMsg = JSON.parse(
          Buffer.from(jsonData.message.data, "base64")
        );
        customerMsg.input.operationMeta.sourceInternalId = msgId + 1;
        jsonData.message.attributes.partyUId =
          partyUId || customerMsg.input.operationMeta.sourceInternalId;
        jsonData.message.attributes.retailUnit =
          retailUnit || jsonData.message.attributes.retailUnit;
        customerMsg.input.account[0].externalSystemRefId =
          customerMsg.input.operationMeta.sourceInternalId;
        customerMsg.input.account[0].partyUId =
          jsonData.message.attributes.partyUId;
        jsonData.message.attributes.publishTime = new Date().toISOString();
        api
          .customerMasterApiCloudTask(
            msgId,
            configObj.icm_api_base_url,
            jsonData.message.attributes.operation.toLowerCase(),
            jsonData.message.attributes.retailUnit,
            jsonData.message.attributes.partyUId,
            jsonData.message.attributes.sourceSystem,
            jsonData.message.attributes.targetSystem,
            customerMsg,
            configObj.projectId,
            configObj.cloud_task_location,
            configObj.cloud_task_queue,
            configObj.icm_onprem_client_secret,
            configObj.icm_onprem_client_id,
            configObj.icm_onprem_apigw_key,
            40
          )
          .then(() => {
            done();
          })
          .catch(err => {
            done(
              new Error(
                `Error occurred during processing message ${msgId} to api gateway: ${err}`
              )
            );
          });
      });

      it.skip("should work to delete a customer using the cloud task queue", function(done) {
        let jsonData = require("./payload_samples/api-pubsub-cm-delete-customer-sample.json");
        let customerMsg = JSON.parse(
          Buffer.from(jsonData.message.data, "base64")
        );
        customerMsg.delete.deleteMeta.sourceInternalId = msgId + 1;
        jsonData.message.attributes.partyUId =
          partyUId || customerMsg.delete.deleteMeta.sourceInternalId;
        jsonData.message.attributes.retailUnit =
          retailUnit || jsonData.message.attributes.retailUnit;
        message.attributes.publishTime = new Date().toISOString();
        api
          .customerMasterApiCloudTask(
            msgId,
            configObj.icm_api_base_url,
            jsonData.message.attributes.operation.toLowerCase(),
            jsonData.message.attributes.retailUnit,
            jsonData.message.attributes.partyUId,
            jsonData.message.attributes.sourceSystem,
            jsonData.message.attributes.targetSystem,
            customerMsg,
            configObj.projectId,
            configObj.cloud_task_location,
            configObj.cloud_task_queue,
            configObj.icm_onprem_client_secret,
            configObj.icm_onprem_client_id,
            configObj.icm_onprem_apigw_key,
            90
          )
          .then(() => {
            done();
          })
          .catch(err => {
            done(
              new Error(
                `Error occurred during processing message ${msgId} to api gateway: ${err}`
              )
            );
          });
      });
    });
  });
});

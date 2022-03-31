"use strict";

const { PubSub } = require("@google-cloud/pubsub");
const logging = require("./logging").errorLogger;
const customerInteractionProjectId = process.env.CUST_INTERACTION_PROJECT_ID;
const customerInteractionSvcAcctEmail = process.env.CUST_INTERACTION_EMAIL;
const customerInteractionTopicName = process.env.CUST_INTERACTION_TOPIC;

async function sendCustInteractionPubsub(
  Uid,
  retailUnit,
  interactionId,
  updatedTs,
  contextType
) {
  try {
    const customerInteractionSvcAcctPrivateKey =
      process.env.CUST_INTERACTION_PRIVATE_KEY;
    const privKey = customerInteractionSvcAcctPrivateKey.replace(/\\n/g, "\n");
    //const privKey="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGnxE4w9AsJI5Q\nuQPGXHSF/ZtlSmhMVI7u19t5Amx+1vKS4WXzwnyd/+9axkLHTNb66aCbsXrkDPsj\nJ/rL/bjism/gPKoc5DuGk/gDksyjplvA7JvED0JZ420ef3QQXnbmTTUpFpmymBVx\nlgv4hPvsW3VjY6tUFUjCnuBXU1eTjUkLyhiKoJa68eAP+hv6dv/sBa6U+n57Uakf\nhgEQ+6t5gWvvKpDFbAMZKC3uWEyj9CWxOF98mKkRbahY6n1CD+1B2ZhLJiJFYJy+\ngN417YXR4cWSJNeETQGCGEBiviEmL8KOHn5o8KwkeGtaz39DkxUnP1IgpyKT9jdA\n3YhLbwwnAgMBAAECggEAJdPOolp8r6OIrSwHYYRjNs+dhFV+9qaWEDvxEyNYiXGj\ngkDGO337YNYI/mdK+Y0TVncfPPe4uW0VeVUYaThZuWcVcoXrOhRnl9JfhkKzkalR\nyTTm15i2YMs1EX1hm+p5x5PFv50LyZ04XEkg34RoPFQQz8yAKUPidxpuDIOVZsbH\nxFnGCEX7klmwlv0+M2crdhS1gPKIjh7+8cIP8gfbPke7rgqzNQvO7LP66lpZiXCD\niJ7y6OV5YJvuB1A3A8r5fPBjjW7U1JBYV3zQ6Vqzdv5Lt9Ouq4aJHmOKznRRCeGz\nrNFR7yqLDTNwGugz6+F3NjbPcdW2lejf0bWY+PhqeQKBgQD8k2pVSaV0pk6/IB59\n4YnwG+fHrsaGhcAmctl9riq9DOZYMVeIk1LUGwB41yR0E/a+tJnCo/UOw167SoIB\nF+lc0EiqW7aCwnppVgY5v2UhzXyOiDKzo5muJUSJlFgNMxE5aTQJTMGqtAcG5ijB\nTwi0X6BDd/haN6GEVkn7SSs92QKBgQDJUGYH8SolYt5dIZQS1D1PspQSFKCfRPFC\n/rHU3In1u77Wdg+ij9STuArbbYuxrdy1lwg66ZfgHtZQiWn8XU2+Vln2PEKL0tMR\nC+RgGTf2igZ2i/FJ/fGslY4rct5m7jZeGlKFlydm7gHuz7tEIdxIxMpZ8w9weKVu\n5vp/sjxZ/wKBgHpU9AWG/Ao5mp5bcilKGcMf4O0IK8Nv+JcmvUxwFOcn3lEM5PaT\nVGTDB0GAAnnuSW4ojuiE/OY/nhxchAb/i9mWT/ujHAzNIPjv32gM2XC70/483UHA\nlWiRSFbScKtD9q211KxEbvC87UJcK5UlMHQcdMT40GLx2tr76C07TSRRAoGAD266\nY6F5OaR6p2kLkOX0TUfDUh+CsLL4S8p6l3bQnKXn20jxqeScxzY0nt2m99f8M2+A\nkgOWQPgcNdBS76W3b//upZG5CD8BLy1aNIO6ZovuMuhHdwSgojpUy7/ijMF2KYCb\nEuKjgqB8RXJnSLHP0UREvuCDLnwRMo9CZMelGMECgYEAsR7dH5EConNVmy/ctZZS\nswTKWzRE063GkeMniaP3ccr7Z/MDoRIC8xyvwfgY8Cwz9T8bWEug9F355A5tSzkK\nPV/3txfumEKxX/f9uGetiHfzLr8MqmVPZPIoB16ZYSeMu2sLwajtH38TpXVQyS80\nDjw5wkiLVp7cS1HFrGT+ibc=\n-----END PRIVATE KEY-----\n";

    const pubsub = new PubSub({
      projectId: customerInteractionProjectId,
      credentials: {
        private_key: privKey,
        client_email: customerInteractionSvcAcctEmail
      }
    });

    /* var outCustomer = {
      "customerInteraction": [
          {
          //"customerId": "IRW92416-8362-Z000-0000-0000123456",
          "customerId": "XXX92416-8362-Z000-0000-0000000000",
          "customerIdType": "CUSTOMER_ID_MASTER",
          "customerIdSource": "ICM",
          "customerIdTrustCode": "MATCH.SYSTEM.EXTERNAL",
          "locationCountryCode": "BE",
          "locationRetailUnitCode": "BE",
          "locationType": "EXT_PHYSICAL",
          "locationCode": "",
          "interactionId": "2101434977878016abcsdef",
          "interactionType": "ADDRESS_CHANGE",
          "interactionTypeVerNo": 1,
          "interactionDatetime": "2019-11-13T14:38:45.041Z", //-- in UTC time . not market's local time.
          "interactionSystemId": "ICF-CI",
          "customerInteractionDetail": [
              {
              "interactionDetailType": "ADDRESS_CHANGE",
              "data": {
                  "addressType": "HOME_GRP1"
              }
              }
          ]
          }
      ]
      }
      ; 
  
      const customerJsonString = JSON.stringify(outCustomer);
      const dataBuffer = Buffer.from(customerJsonString);
  
      const messageId = await pubsub.topic(customerInteractionTopicName).publish(dataBuffer);
      console.info('Message Id=' + messageId + '. Message sent to Pub Sub. pubsub.sendCustomerPubsub(). Message Data='+ customerJsonString );
      */

    var retailUnitToUpper = retailUnit.toUpperCase();
    var outCustomer = {
      customerId: Uid,
      customerIdType: "CUSTOMER_ID_MASTER",
      customerIdSource: "ICM",
      customerIdTrustCode: "MATCH.SYSTEM.EXTERNAL",
      locationCountryCode: retailUnitToUpper,
      locationRetailUnitCode: retailUnitToUpper,
      locationType: "EXT_PHYSICAL",
      locationCode: "",
      interactionId: interactionId,
      interactionType: "ADDRESS_CHANGE",
      interactionTypeVerNo: 1,
      interactionDatetime: updatedTs,
      interactionSystemId: "ICF-CI",
      customerInteractionDetail: [
        {
          interactionDetailType: "ADDRESS_CHANGE",
          data: {
            addressType: contextType
          }
        }
      ]
    };

    const customerJsonString = JSON.stringify(outCustomer);
    const dataBuffer = Buffer.from(customerJsonString);

    const messageId = await pubsub
      .topic(customerInteractionTopicName)
      .publish(dataBuffer);
    logging.info(
      "Message Id=" +
        messageId +
        ". Message sent to Pub Sub. pubsub.sendCustInteractionPubsub(). Message Data=" +
        customerJsonString
    );
  } catch (error) {
    logging.error("Error in sendCustInteractionPubsub.", error);
    throw new Error("Error in sendCustInteractionPubsub");
  }
}

async function sendCustInteractionPubsub2(
  Uid,
  retailUnit,
  interactionId,
  interActionData
) {
  try {
    const customerInteractionSvcAcctPrivateKey =
      process.env.CUST_INTERACTION_PRIVATE_KEY;
    const privKey = customerInteractionSvcAcctPrivateKey.replace(/\\n/g, "\n");

    const pubsub = new PubSub({
      projectId: customerInteractionProjectId,
      credentials: {
        private_key: privKey,
        client_email: customerInteractionSvcAcctEmail
      }
    });

    //set interaction id to the message ID from customer update Pub/Sub
    interActionData.customerInteraction[0].interactionId = interactionId;
    const customerJsonString = JSON.stringify(interActionData);

    const dataBuffer = Buffer.from(customerJsonString);
    //send message

    /*
    const messageId = await pubsub
      .topic(customerInteractionTopicName)
      .publish(dataBuffer);
    */
    let messageId = "000000000";

    logging.info(
      `Message ${interactionId} sent to Interaction Core Pub Sub for partyUid ${Uid} retail unit ${retailUnit}. Message Id was ${messageId}. Data:` +
        customerJsonString
    );
  } catch (error) {
    logging.error(
      `Error in sendCustInteractionPubsub for partyUid ${Uid} retail unit ${retailUnit}.`,
      error
    );
    throw new Error(
      `Error in sendCustInteractionPubsub for partyUid ${Uid} retail unit ${retailUnit}`
    );
  }
}
module.exports.sendCustInteractionPubsub = sendCustInteractionPubsub;
module.exports.sendCustInteractionPubsub2 = sendCustInteractionPubsub2;

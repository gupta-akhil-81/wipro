'use strict';

const {PubSub} = require('@google-cloud/pubsub');
const logger = require('./logging').logger;

// changes for schema validation - adding attributes source(consumer) and target system , icf - 7414
const consumer = process.env.CONSUMER;
const targetSystem = process.env.TARGETSYSTEM;

const pubsub = new PubSub();
const topicName = process.env.PUBSUB_TOPIC_NAME;

const sendCustomerPubsub = async (personRecord, index, Uid, fileName) => {
  try {
    var elements = personRecord.toString().split(',');
    var updateDate = new Date(new Date().toUTCString());
    //var customerNo = trimDoubleQuotes(elements[4]);
    var city = trimDoubleQuotes(elements[19]);
    var country = trimDoubleQuotes(elements[20]);
    var streetAddress1 = trimDoubleQuotes(elements[14]) + ' ' + trimDoubleQuotes(elements[15]);
    var postalCode = trimDoubleQuotes(elements[18]);
    var floorNo = trimDoubleQuotes(elements[17]);
    var apartmentNumber = trimDoubleQuotes(elements[16]);
    var interactionId = 'BEBPOST-' + Date.now();
    var outCustomer = {
      update: {
        partialUpdateMeta: {
          consumer: 'BEBPOST',
          operationMeta: 'ADDRESS',
        },
        customer: {
          updated: updateDate,
          addresses: [
            {
              contextType: 'HOME_GRP1',
              city: city,
              postalCode: postalCode,
              country: country,
              floorNo: floorNo,
              streetAddress1: streetAddress1,
              apartmentNumber: apartmentNumber,
              updated: updateDate,
            },
          ],
        },
      },
      interaction: {
        data: {
          customerId: Uid,
          customerIdType: 'CUSTOMER_ID_MASTER',
          customerIdSource: 'ICM',
          customerIdTrustCode: 'MATCH.SYSTEM.EXTERNAL',
          locationCountryCode: 'BE',
          locationRetailUnitCode: 'BE',
          locationType: 'EXT_PHYSICAL',
          locationCode: '',
          interactionId: interactionId,
          interactionType: 'ADDRESS_CHANGE',
          interactionTypeVerNo: 1,
          interactionDatetime: updateDate,
          interactionSystemId: 'ICF-CI',
          customerInteractionDetail: [
            {
              interactionDetailType: 'ADDRESS_CHANGE',
              data: {
                addressType: 'HOME_GRP1',
              },
            },
          ],
        },
      },
    };
    const customerJsonString = JSON.stringify(outCustomer);
    const dataBuffer = Buffer.from(customerJsonString);
    const customAttributes = {
      retailUnit: 'be',
      partyUId: Uid,
      operation: 'partialUpdate',
      sourceSystem: consumer,
      targetSystem: targetSystem,
    };

    const messageId = await pubsub.topic(topicName).publish(dataBuffer, customAttributes);

    logger.info(
      'Send data to Customer update Pub/Sub. File=' +
        fileName +
        '. Record number=' +
        index +
        '. UID=' +
        Uid +
        '. Message Id=' +
        messageId,
      {
        dataFileName: fileName,
        recordIndex: index,
        partyUid: Uid,
        messageId: messageId,
        messagePayload: customerJsonString,
        messageAttributes: JSON.stringify(customAttributes),
      }
    );

    return;
  } catch (error) {
    logger.error(
      'Exception occured in sendCustomerPubsub for file ' +
        fileName +
        '. Record number=' +
        index +
        '. UID=' +
        Uid,
      {
        dataFileName: fileName,
        recordIndex: index,
        partyUid: Uid,
        errorMessage: error.message,
      }
    );

    throw new Error('Error sending message to Pub Sub. UID=' + Uid);
  }
};

function trimDoubleQuotes(str) {
  if (str === undefined) {
    return '';
  }
  if (str === '') {
    return '';
  }

  str = str.trim();

  if (str === '"' || str === "'") {
    return '';
  }

  if (str.length > 1) {
    if (str.startsWith('"') || str.startsWith("'")) {
      str = str.substring(1, str.length - 1);
    }
  }

  if (str === '"' || str === "'") {
    return '';
  }

  if (str.length > 1) {
    if (str.endsWith('"') || str.endsWith("'")) {
      str = str.substring(0, str.length - 1);
    }
  }

  str = str.trim();

  return str;
}

module.exports.sendCustomerPubsub = sendCustomerPubsub;

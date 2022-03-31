const logging = require("./logging").errorLogger;

module.exports.parseMessageBody = function(body) {
  try {
    var message = body ? body.message : null;
    var messageId = message.messageId;
  } catch (error) {
    logging.error(
      "Message parsing error in parseMessageBody: " + messageId,
      error.stack
    );
    throw error;
  }

  return message;
};

module.exports.decodeAndParseMsg = function(message) {
  try {
    var messageId = message.messageId;

    if (message.data && message.attributes) {
      var buffer = Buffer.from(message.data, "base64");
      var data = buffer ? buffer.toString() : null;
      var retailUnit = message.attributes["retailUnit"] || null;
      var partyUId = message.attributes["partyUId"] || null;
      var operation = message.attributes["operation"] || null;
      var sourceSystem = message.attributes["sourceSystem"] || null;
      var targetSystem = message.attributes["targetSystem"] || null;
      var jsonData = JSON.parse(data);
      var consumer;

      switch (operation) {
        case "create":
          consumer = jsonData.create.createMeta.consumer;
          break;
        case "update":
          consumer = jsonData.update.updateMeta.consumer;
          break;
        case "input":
          consumer = jsonData.input.operationMeta.externalSystemId;
          break;
        case "delete":
          consumer = jsonData.delete.deleteMeta.consumer;
          break;
        case "partialUpdate":
          consumer = jsonData.update.partialUpdateMeta.consumer;
          break;
        default:
          if (message.attributes["sourceSystem"]) {
            consumer = message.attributes["sourceSystem"];
          }
      }

      let parseResult = {
        retailUnit: `${retailUnit}`,
        partyUId: `${partyUId}`,
        operation: `${operation}`,
        sourceSystem: `${sourceSystem}`,
        targetSystem: `${targetSystem}`,
        data: `${data}`,
        dataJSON: `${jsonData}`,
        consumer: `${consumer}`
      };

      //add validation code/logic here for all rules to check for
      return parseResult;
    } else {
      logging.error(
        "Parsing exption occured in decodeAndParseMsg. Message " +
          messageId +
          " had bad data or attributes"
      );
      throw "Parsing exption occured in decodeAndParseMsg. Message " +
        messageId +
        " had bad data or attributes.";
    }
  } catch (error) {
    logging.error(
      "Parsing exption occured in decodeAndParseMsg. Message " +
        messageId +
        " had bad data or attributes"
    );
    throw error;
  }
};

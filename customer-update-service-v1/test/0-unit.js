var expect = require("chai").expect;
const messageParser = require("../lib/messageParser");
var messageSample_1 = `{"message":
{"attributes":{"operation":"partialUpdate","partyUId":"B5D394B9-6B62-11e9-8214-005056B12CB9","retailUnit":"gb"},"data":"eyJ1cGRhdGUiOnsicGFydGlhbFVwZGF0ZU1ldGEiOnsiY29uc3VtZXIiOiJJUE9TIiwib3BlcmF0aW9uTWV0YSI6IkFERFJFU1MifSwiY3VzdG9tZXIiOnsidXBkYXRlZCI6IjIwMTktMDUtMjRUMDk6MzA6NTMuMTY2WiIsImFkZHJlc3NlcyI6W3siY29udGV4dFR5cGUiOiJIT01FX0dSUDEiLCJjaXR5IjoiV2ltYmVsZG9uIiwicG9zdGFsQ29kZSI6IkxTMTggNEFCIiwic3RhdGUiOiJNYW5jaGVzdGVyIiwiY291bnRyeSI6IkdCIiwiaG91c2VOdW1iZXIiOiIxMTEtNTMiLCJzdHJlZXRBZGRyZXNzMSI6InRlc3QgIDEyMDEsIEZMT09SIDgiLCJzdHJlZXRBZGRyZXNzMiI6IkxnaCAxNDAyIiwidXBkYXRlZCI6IjIwMTktMDUtMjRUMDk6MzA6NTMuMTY2WiJ9XX19fQ==","messageId":"589285969581876","message_id":"589285969581876","publishTime":"2019-06-19T11:04:26.677Z","publish_time":"2019-06-19T11:04:26.677Z"}
}`;


var configObj;


describe("Unit tests for message parsing and formatting", function() {
  //load environment values and decrypt
  before(function(done) {
    this.enableTimeouts(false);
    const configLoader = require("../lib/envLoader");
    configLoader.SetEncryptedEnvVariables().then(() => {
      configObj = require("../lib/config");
      done();
    });
  });

  /* describe("Unit of encryption and decryption ", function() {
    var cipherText = "";
    var randomString;

    it("should work to decrypt using KMS.", function(done) {
      
      if(configObj.test_kms_value == "TEST") {
        done();
      }else{
        done(new Error("KMS test failed."));
      }
    });
  }); */

  describe("Unit testing to parse body and message ", function() {
    it("should be Ok to parse the message body using parseMessageBody", function() {
      //not sure how to test bodyclear
    });

    it("should be Ok to parse the message body using decodeAndParseMsg and get all the values", function(done) {
      try {
        var obj = JSON.parse(messageSample_1);

        expect(obj.message).to.have.property("messageId");
        expect(obj.message.messageId).not.to.be.empty;
        expect(obj.message).to.have.property("data");
        expect(obj.message.data).not.to.be.empty;
        expect(obj.message).to.have.property("attributes");
        expect(obj.message.attributes).not.to.be.empty;

        var resultData = messageParser.decodeAndParseMsg(obj.message);

        expect(resultData).to.have.property("retailUnit");
        expect(resultData.retailUnit).not.to.be.empty;
        expect(resultData).to.have.property("partyUId");
        expect(resultData.partyUId).not.to.be.empty;
        expect(resultData).to.have.property("operation");
        expect(resultData.operation).not.to.be.empty;
        expect(resultData).to.have.property("data");
        expect(resultData.data).not.to.be.empty;
        expect(resultData).to.have.property("dataJSON");
        expect(resultData.dataJSON).not.to.be.empty;
        done();
      } catch (err) {
        done(err);
      }
    });
  });
/* Udaya Changes Starts for ICF-2098 & ICF-998 */
  describe("Unit testing to validate customer Create/Update/Delete/Subscribe/UnSubscribe Message Sync Publish", function() {
    it("should be Ok to parse and decode the message body", function(done) {
      try {
        let jsonData = require('./payload_samples/api-pubsub-cm-create-customer-sample.json');
        let customerMsg = JSON.parse(Buffer.from(jsonData.message.data, 'base64'));
        expect(customerMsg).to.have.property("create");
        expect(customerMsg.create).to.have.property("createMeta");done();
      } catch (err) {
      done(err);
    }
    });

    it("should be Ok to validate message and check all the key attributes", function(done) {
      try {
        let obj = require('./payload_samples/api-pubsub-cm-create-customer-sample.json');      
        expect(obj.message).to.have.property("messageId");
        expect(obj.message.messageId).not.to.be.empty;
        expect(obj.message).to.have.property("data");
        expect(obj.message.data).not.to.be.empty;
        expect(obj.message).to.have.property("attributes");
        expect(obj.message.attributes).not.to.be.empty;
        expect(obj.message.attributes).to.have.property("retailUnit");
        expect(obj.message.attributes.retailUnit).not.to.be.empty;
        expect(obj.message.attributes).to.have.property("partyUId");
        expect(obj.message.attributes.partyUId).not.to.be.empty;
        expect(obj.message.attributes).to.have.property("operation");
        expect(obj.message.attributes.operation).not.to.be.empty;
        expect(obj.message.attributes).to.have.property("sourceSystem");
        expect(obj.message.attributes.sourceSystem).not.to.be.empty;
        expect(obj.message.attributes).to.have.property("targetSystem");
        expect(obj.message.attributes.targetSystem).not.to.be.empty;
        done();
      } catch (err) {
        done(err);
      }
    });
  });
  /* Udaya Changes Ends for ICF-2098 & ICF-998 */
});

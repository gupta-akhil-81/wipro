'use strict';
const assert = require('assert');
const logger = require('../lib/logging').logger;
const secMngr = require('../lib/secretManager');
const ftpMngr = require('../lib/ftp');
const fileMngr = require('../lib/file-processor');
const findMngr = require('../lib/lookup');

const sleep = milliseconds => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

describe('Integration Test Suite', function() {
  before(function(done) {
    this.enableTimeouts(false);
    secMngr
      .setSecretsAsEnvVars()
      .then(() => {
        logger.info('Completed SetEnvVars.');
        done();
      })
      .catch(err => {
        logger.info('Error in SetEnvVars.');
        done(err);
      });
  });

  describe.skip('Pub/Sub tests', function() {
    it('should work to connect to the pub/sub topic', function(done) {
      const {PubSub} = require('@google-cloud/pubsub');
      const pubSub = new PubSub();
      let hasCustomerUpdateTopic = false;

      const expectedTopicName =
        'projects/' + process.env.PROJECT_ID + '/topics/' + process.env.PUBSUB_TOPIC_NAME;

      pubSub
        .getTopics()
        .then(topicsData => {
          const topics = topicsData[0];
          topics.forEach(topic => {
            logger.info(topic.name);

            if (topic.name === expectedTopicName) {
              hasCustomerUpdateTopic = true;
            }
          });

          assert.strictEqual(hasCustomerUpdateTopic, true);
        })
        .then(() => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe.skip('SFTP tests', function() {
    it('should work to connect to the SFTP', function(done) {
      let ftpIsOk = false;

      ftpMngr
        .testFtpConnection()
        .then(p => {
          if (p !== null) {
            ftpIsOk = true;
          } else {
            ftpIsOk = false;
          }
        })
        .then(() => {
          assert(ftpIsOk, true);
        })
        .then(() => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });

  describe('File processing tests', function() {
    it('should work to process sample file 15', function(done) {
      let familyNumberToTest = '6275986366019484986';
      let timeStamp = Date.now();
      let fileName = 'bpost-15';
      fileMngr.createTestFile(timeStamp, fileName).then(() => {
        return fileMngr.uploadTestFile(fileName).then(() => {
          return fileMngr.processDownloadedFiles().then(() => {
            return sleep(20000).then(() => {
              return findMngr
                .getUserFromCard(familyNumberToTest)
                .then(customer => {
                  let valueToTest = customer.addresses[0].streetAddress1;
                  assert(valueToTest.startsWith(timeStamp), 'Profile has updated address1 value');
                  done();
                })
                .catch(err => {
                  done(err);
                });
            });
          });
        });
      });
    });
    it.skip('should work to process sample file 1000', function(done) {
      let familyNumberToTest = '6275980163400004109';
      let timeStamp = Date.now();
      let fileName = 'bpost-1000';
      fileMngr.createTestFile(timeStamp, fileName).then(() => {
        return fileMngr.uploadTestFile(fileName).then(() => {
          return fileMngr.processDownloadedFiles().then(() => {
            return sleep(30000).then(() => {
              return findMngr
                .getUserFromCard(familyNumberToTest)
                .then(customer => {
                  let valueToTest = customer.addresses[0].streetAddress1;
                  assert(valueToTest.startsWith(timeStamp), 'Profile has updated address1 value');
                  done();
                })
                .catch(err => {
                  done(err);
                });
            });
          });
        });
      });
    });
  });
});

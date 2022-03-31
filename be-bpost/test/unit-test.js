'use strict';

// const path= __dirname + '/../.env';
// require ('dotenv').config({path: path});

const assert = require('assert');
const logger = require('../lib/logging').logger;
const secMngr = require('../lib/secretManager');

describe('Basic Mocha Unit Testing Suite', function() {
  before(function(done) {
    this.enableTimeouts(false);
    secMngr.setSecretsAsEnvVars().then(() => {
      logger.info('Completed SetEnvVars ');
      done();
    });
  });

  it('Trim quotes, double quotes and spcaes from the string.', function() {
    const fileProcessor = require('../lib/file-processor.js');

    //assert.strictEqual(fileProcessor.trimDoubleQuotes(' '), '');
    assert.strictEqual(fileProcessor.trimDoubleQuotes('"hello"'), 'hello');
    assert.strictEqual(fileProcessor.trimDoubleQuotes('"hello"  '), 'hello');
    assert.strictEqual(fileProcessor.trimDoubleQuotes('   "hello"'), 'hello');
    assert.strictEqual(fileProcessor.trimDoubleQuotes(null), '');
    assert.strictEqual(fileProcessor.trimDoubleQuotes('"'), '');
    assert.strictEqual(fileProcessor.trimDoubleQuotes("'"), '');
    assert.strictEqual(fileProcessor.trimDoubleQuotes('"hello"'), 'hello');
  });
});

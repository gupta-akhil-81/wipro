'use strict';

const lookUp = require('./lookup.js');
const pubsub = require('./pubsub.js');
const {Storage} = require('@google-cloud/storage');
const logger = require('./logging').logger;
const storage = new Storage();
const ftp = require('./ftp.js');
const fs = require('fs');
const path = require('path');

/*controls the main flow for downloading and processing files */

function processMain() {
  return ftp
    .downloadNewFiles()
    .then(result => {
      return new Promise(resolve => {
        setTimeout(() => resolve(result), process.env.DELAY_BEFORE_START_READING_FROM_BUCKET);
      });
    })
    .then(() => {
      return processDownloadedFiles();
    })
    .catch(error => {
      logger.error('Exception occured in processMain(). ' + error, {
        stack: error.stack,
        errorMessage: error.message,
      });
    });
}

/* Process all files that are downloaded to Bucket.
Get the list of all downloaded files.
Process each file one by one. */
function processDownloadedFiles() {
  return new Promise(function(resolve, reject) {
    getDownloadedFilesListFromBucket()
      .then(function(fileArr) {
        if (fileArr.length === 0) {
          //no files to process in bucket
          logger.info('No files present in bucket to process.');
          resolve(true);
        } else {
          logger.info(
            'Start processing files. Number of files in the downloaded folder in bucket is ' +
              fileArr.length +
              '.',
            {
              NoOfCSVFilesToProcess: fileArr.length,
              CSVFilesToProcess: getFileNamesStringFromGFileArray(fileArr),
            }
          );
          //process all files
          return Promise.all(fileArr.map(item => processFile(item.name)));
        }
      })
      .then(() => {
        resolve(true);
      })
      .catch(error => {
        logger.error('Exception occured in file-processor.processDownloadedFiles()', {
          stack: error.stack,
          errorMessage: error.message,
        });
        reject(error);
      });
  });
}
/* This function returns the list of all files present in the Downloaded folder of the Bucket. */
async function getDownloadedFilesListFromBucket() {
  const directory = process.env.DOWNLOAD_DIRECTORY;
  var options = {
    directory: directory,
    delimiter: '/',
    includeTrailingDelimiter: false,
  };

  const [files] = await storage.bucket(process.env.BUCKET_NAME).getFiles(options);

  if (files.length > 0 || files[0].name === process.env.DOWNLOAD_DIRECTORY + '/') {
    //skip the actual folder
    files.splice(0, 1);
  }

  return files;
}
// save files in backup folder(should be done with env parameters as well)
async function backupFile(fileName, bucket) {
  var targetFileName =
    process.env.BACKUP_DIRECTORY + '/' + fileName.slice(process.env.DOWNLOAD_DIRECTORY.length + 1);

  return bucket.file(fileName).copy(targetFileName);
}

async function deleteFile(fileName, bucket) {
  return bucket.file(fileName).delete();
}

async function processFile(fileName) {
  var errArray = [];
  let bucket = storage.bucket(process.env.BUCKET_NAME);
  //create bkup of file
  backupFile(fileName, bucket);
  //read records in file
  var recArray = await readCSV(fileName, bucket);
  //get total # of records
  var totalElements = recArray.length;
  logger.info('Start to process BPOST file ' + fileName, {
    noOfRecordsToProcess: totalElements,
    dataFileName: fileName,
  });

  var batchSize = 10;
  var batchCount = totalElements / batchSize + 1;
  //process records in batches
  for (var i = 1; i <= batchCount; i++) {
    let startIndex = (i - 1) * batchSize;
    let endIndex = startIndex + batchSize - 1;
    let loopArray = recArray.slice(startIndex, endIndex);
    await Promise.all(
      loopArray.map((rec, index) => processRecord(rec, startIndex + index, fileName, errArray))
    );
    //wait 2 sec until next batch
    sleep(2000).then(() => {});
  }
  //check if we have processing errors
  if (errArray.length > 0) {
    var errorFileName =
      process.env.LOCAL_ERR_DIRECTORY +
      '/' +
      fileName.slice(process.env.DOWNLOAD_DIRECTORY.length + 1) +
      '_' +
      Date.now() +
      '.csv';
    let errFile = bucket.file(errorFileName);
    errFile.save(errArray.join('\n')).then(function() {});

    logger.info(
      'Processing summary for BPOST file:' +
        fileName +
        ' Error file written=' +
        errorFileName +
        '. Number of error records=' +
        errArray.length +
        '. file-processor.processFile()',
      {
        dataFileName: fileName,
        errorFileName: errorFileName,
        noOfRecordsToProcess: totalElements,
        noOfErrorRecords: errArray.length,
      }
    );
  } else {
    logger.info('Processing summary for BPOST file:' + fileName + '. No errors', {
      dataFileName: fileName,
      noOfRecordsToProcess: totalElements,
      noOfErrorRecords: 0,
    });
  }
  //delete file from bucket
  deleteFile(fileName, bucket);
  return 'File processed';
}

async function readCSV(fileName, bucket) {
  var recArr = [];
  return new Promise((resolve, reject) => {
    const bucketFile = bucket.file(fileName);
    bucketFile.download(function(err, fileContents) {
      try {
        recArr = fileContents
          .toString()
          .trim()
          .split('\n');
        resolve(recArr);
      } catch (error) {
        logger.error('Exception occured in readCSV(). ' + error, {
          stack: error.stack,
          errorMessage: error.message,
          dataFileName: fileName,
        });
        reject(error);
      }
    });
  });
}

// get uid based on xyz family number
const processRecord = async (personRecord, index, fileName, errArray) => {
  var elements = personRecord.toString().split(',');
  var familyID = trimDoubleQuotes(elements[4]); //personRecord.Additional_info;

  if (familyID === '' || familyID === undefined) {
    logger.warn(
      'Loyalty number missing for BPOST record in file ' +
        fileName +
        '. Record number=' +
        index +
        '. Loyality number=' +
        familyID +
        '. Invalid/missing loyalty number. Pushing to error file. file-processor.processRecord()',

      {
        dataFileName: fileName,
        recordIndex: index,
        errorMessage: 'Invalid/missing loyalty number',
      }
    );
    errArray.push(personRecord);
    return 'send to error array due to invalid loyality number';
  }
  //all is OK, process record to Customer update service
  familyID = familyID.trim();
  if (familyID.length === 13) {
    if (!familyID.startsWith(process.env.LOYALTY_CARD_NUMBER_PREFIX)) {
      familyID = process.env.LOYALTY_CARD_NUMBER_PREFIX + familyID;
    }
  }

  var Uid = 'MISSING';

  try {
    //get partyUID based on Family#
    Uid = await lookUp.getUID(index, familyID, fileName);
  } catch (error) {
    logger.error(
      'Exception #1 occured when looking up familiy number in ICM for record in file ' +
        fileName +
        '. Record number=' +
        index +
        '. Loyality number=' +
        familyID +
        '. Error getting partyUid from ICM. Pushing record to error file.',

      {
        dataFileName: fileName,
        recordIndex: index,
        familyID: familyID,
        errorMessage: 'Error getting partyUid from ICM' + error.message,
      }
    );

    errArray.push(personRecord);

    return 'send to error array due to error getting UID';
  }

  if (Uid !== 'MISSING') {
    try {
      await pubsub.sendCustomerPubsub(personRecord, index, Uid, fileName);
      return 'sent to pub sub';
    } catch (error) {
      logger.error(
        'Exception occured when processing BPOST record in file ' +
          fileName +
          '. Record number=' +
          index +
          '. Loyality number=' +
          familyID +
          '. Error sending to Customer Update pub/sub.',
        {
          dataFileName: fileName,
          recordIndex: index,
          familyID: familyID,
          partyUid: Uid,
          errorMessage: error.message,
        }
      );
      errArray.push(personRecord);
      return 'send to error array due to error sending to pub sub';
    }
  } else {
    errArray.push(personRecord);
    return 'send to error array due to missing UID';
  }
};

function trimDoubleQuotes(str) {
  if (str === undefined || str === null) {
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

const sleep = milliseconds => {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
};

function getFileNamesStringFromGFileArray(namesArray) {
  let i = 0;
  let result = '';
  for (i = 0; i < namesArray.length; i++) {
    result += namesArray[i].name + '|';
  }
  return result;
}

// promisify fs.readFile()
fs.readFileAsync = function(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, buffer) => {
      if (err) reject(err);
      else resolve(buffer);
    });
  });
};

async function createTestFile(changeID, fileNameToUse) {
  let fileName = path.join(__dirname, `../test/payload_samples/${fileNameToUse}.csv`);
  let newFileName = path.join(__dirname, `../test/payload_samples/${fileNameToUse}-test.csv`);
  let outDataStr = '';
  return fs
    .readFileAsync(fileName, 'utf8')
    .then(fileContent => {
      return fileContent
        .toString()
        .trim()
        .split('\n');
    })
    .then(recArr => {
      recArr.forEach(function(element) {
        var elements = element.toString().split(',');
        elements[14] = changeID;
        outDataStr = outDataStr + elements.toString() + `\n`;
      });

      return outDataStr;
    })
    .then(outData => {
      fs.writeFileSync(newFileName, outData, function(err) {
        if (err) throw err;
      });

      return 'OK';
    });
}
async function uploadTestFile(fileName) {
  const directory = process.env.DOWNLOAD_DIRECTORY;
  const options = {
    destination: `${directory}/${fileName}-test.csv`,
  };
  let fqlFileName = path.join(__dirname, `../test/payload_samples/${fileName}-test.csv`);
  await storage.bucket(process.env.BUCKET_NAME).upload(fqlFileName, options);
}
module.exports.processDownloadedFiles = processDownloadedFiles;
module.exports.trimDoubleQuotes = trimDoubleQuotes;
module.exports.processMain = processMain;
module.exports.createTestFile = createTestFile;
module.exports.uploadTestFile = uploadTestFile;

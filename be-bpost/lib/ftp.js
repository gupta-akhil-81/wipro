'use strict';

const {Storage} = require('@google-cloud/storage');
const path = require('path');
const SSH2_SFTP_Client = require('ssh2-sftp-client');
const logger = require('./logging').logger;

/*
this function connects to FTP, change  to the required directory on ftp, and 
download all the 
*/
function downloadNewFiles() {
  let srcDir = '/' + process.env.FTP_DIRECTORY + '/';
  let sftpClient = new SSH2_SFTP_Client();
  const SFTP_CONFIG = {
    host: process.env.FTP_HOST,
    port: 22,
    username: process.env.FTP_USER,
    privateKey: process.env.BPOST_PRIVATE_KEY,
    passphrase: process.env.BPOST_PASSPHRASE,
  };

  return new Promise(function(resolve, reject) {
    sftpClient
      .connect(SFTP_CONFIG)
      .then(() => {
        return sftpClient.list(srcDir);
      })
      .then(allFiles => {
        return allFiles.filter(csvFilesFilter);
      })
      .then(csvFiles => {
        logger.info(
          'Number of BPOST CSV files present in FTP directory(' +
            srcDir +
            ') =' +
            csvFiles.length +
            '.',
          {
            NoOfCSVFilesToProcess: csvFiles.length,
            CSVFilesToProcess: getFileNamesStringFromGFileArray(csvFiles),
          }
        );

        if (csvFiles.length === 0) {
          logger.info('No BPOST CSV files to download, disconnecting from FTP');
          return;
        } else {
          return csvFiles;
        }
      })
      .then(csvFiles => {
        if (csvFiles !== undefined) {
          logger.info('Start downloading files from FTP');
          return Promise.all(
            csvFiles.map(csvFile => downloadFile(sftpClient, srcDir, csvFile.name))
          ).then(() => {
            logger.info('Start deleting files from FTP');
            return Promise.all(
              csvFiles.map(csvFile => deleteFile(sftpClient, srcDir, csvFile.name))
            );
          });
        }
      })
      .then(() => {
        sftpClient.end();
        resolve(true);
      })
      .catch(error => {
        logger.error('Exception occured in ftp.downloadNewFiles(). ' + error, {
          stack: error.stack,
          errorMessage: error.message,
        });
        reject(error);
      });
  });
}

// filter for only getting files with certain file extension
function csvFilesFilter(fileList) {
  return fileList.type !== 'd' && path.extname(fileList.name) === process.env.FILE_EXT;
}

/* Download the file from FTP and upload in the downloaded folder in bucket  */
async function downloadFile(sftpClient, srcDir, fileName) {
  try {
    const data = await sftpClient.get(srcDir + fileName);
    const storage = new Storage();
    const bucket = storage.bucket(process.env.BUCKET_NAME);
    const blob = bucket.file(process.env.DOWNLOAD_DIRECTORY + '/' + fileName);
    const blobStream = blob.createWriteStream();
    const Readable = require('stream').Readable;
    const s = new Readable();
    s.push(data);
    s.push(null);
    s.pipe(blobStream);
  } catch (error) {
    logger.error('Exception occured in downloadFile for file:' + srcDir + fileName, {
      errorMessage: error.message,
      errorFile: srcDir + fileName,
    });

    throw new Error('Error downloading File =' + srcDir + fileName);
  }
  logger.info('File=' + fileName + '. Download completed. ftp.downloadFile()');
  return 'downloadFile done.';
}

async function deleteFile(sftpClient, srcDir, fileName) {
  const del = await sftpClient.delete(srcDir + fileName);
  logger.info('File=' + srcDir + fileName + '. Deleted from FTP. ftp.deleteFile()');
  return del;
}

function getFileNamesStringFromGFileArray(namesArray) {
  let i = 0;
  let result = '';
  for (i = 0; i < namesArray.length; i++) {
    result += namesArray[i].name + '|';
  }
  return result;
}
async function testFtpConnection() {
  let sftpClient = new SSH2_SFTP_Client();
  const SFTP_CONFIG = {
    host: process.env.FTP_HOST,
    port: 22,
    username: process.env.FTP_USER,
    privateKey: process.env.BPOST_PRIVATE_KEY,
    passphrase: process.env.BPOST_PASSPHRASE,
    debug: msg => {
      console.error(msg);
    },
  };

  try {
    let sftp = await sftpClient.connect(SFTP_CONFIG);
    let d = await sftp.cwd();
    return d;
  } catch (e) {
    console.log(e);
  } finally {
    await sftpClient.end();
  }
}
module.exports.downloadNewFiles = downloadNewFiles;
module.exports.testFtpConnection = testFtpConnection;

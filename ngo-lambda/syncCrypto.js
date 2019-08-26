'use strict';

/*
    Provides methods for downloading crypto credentials from S3
*/

const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const config = require("./config");
const logger = require("./logging").getLogger("syncCrypto");
const cryptoFolder = config.cryptoFolder;
const bucketName = config.s3CryptoBucket;

// const s3 = new AWS.S3({
//   signatureVersion: 'v4',
//   accessKeyId: config.s3AccessKeyId,
//   secretAccessKey: config.s3SecretAccessKey
// });

const s3 = new AWS.S3({
    signatureVersion: 'v4'
});

// Helper function that streams an S3 object to a local file
async function downloadFile(s3Object) {
    const getParams = {Bucket: bucketName, Key: s3Object.Key};
    const fileWriteStream = fs.createWriteStream(path.join(cryptoFolder, s3Object.Key));
    return new Promise((resolve, reject) => {
        s3.getObject(getParams).createReadStream()
        .on('end', () => {
            return resolve();
        }).on('error', (error) => {
            return reject(error);
        }).pipe(fileWriteStream)
    });
}

/*
    Download all credentials to local folder
*/
async function downloadCredentials() {
    logger.info("Start of downloadCredentials");
    const listParams = {Bucket: bucketName};
    let listPromise = s3.listObjectsV2(listParams).promise();

    return listPromise.then((data) => {
        logger.info("Downloading " + data.Contents.length + " files");
        let promiseArray = [];
        data.Contents.forEach(async (data) => {
            promiseArray.push(downloadFile(data))
        })
        logger.info("Finished downloading credentials.");
        return Promise.all(promiseArray);
    }).catch((err) => {
        logger.error("Caught error downloading credentials. " + err);
        throw err;
    })
}

module.exports = {
    downloadCredentials
};
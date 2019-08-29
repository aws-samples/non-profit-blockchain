/*
    Query Fabric via a lambda function
*/

'use strict';

const config = require("./config");
const query = require("./query");
const syncCrypto = require("./syncCrypto");
const logger = require("./logging").getLogger("lambdaFunction");

function buildRequest(donorName) {
    const args = JSON.stringify({donorUserName: donorName});
	const request = {
		chaincodeId: config.chaincodeId,
        fcn: 'queryDonor',
        args,
		chainId: config.channelName,
    };
    
    return request;
};

async function handler(event) {
    const promise = new Promise(async (resolve, reject) => {
        let donorName = event.donorName;
        if (!donorName) {
            return resolve("Please provide a donor name")
        }
        try {
            logger.info("=== Handler Function Start ===");
        
            logger.info("Downloading credentials from S3...");
            await syncCrypto.downloadCredentials();
                
            logger.info("Querying donor");
            const request = buildRequest(donorName);
            let result = await query(request);
        
            logger.info("=== Handler Function End ===");  
            resolve("Donor is " + result);
        } catch (err) {
            logger.error("Error: " + err);
            reject(Error(err));
        }
    });
    return promise;
};

module.exports = {handler};
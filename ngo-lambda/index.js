/*
    A generic handler for executing Fabric chaincode functions
*/

'use strict';

const config = require("./config");
const queryHandler = require("./query");
const invokeHandler = require("./invoke");
const logger = require("./logging").getLogger("lambdaFunction");

function buildCommonRequestObject(chaincodeFunction, chaincodeFunctionArgs) {
    const argsString = JSON.stringify(chaincodeFunctionArgs);
	const request = {
        chaincodeId: config.chaincodeId,
        fcn: chaincodeFunction,
        args: [argsString],
        chainId: config.channelName,
    };
    
    return request;
};

async function handler(event) {
    const promise = new Promise(async (resolve, reject) => {

        let functionType = event.functionType;
        let handlerFunction;

        if (functionType == "query") {
            handlerFunction = queryHandler;
        } else if (functionType == "invoke") {
            handlerFunction = invokeHandler;
        } else {
            return reject("functionType must be of type 'query' or 'invoke'");
        }

        let chaincodeFunction = event.chaincodeFunction;
        if (!chaincodeFunction) {
            return reject("'chaincodeFunction' must be specified");
        }

        let chaincodeFunctionArgs = event.chaincodeFunctionArgs || {};

        try {
            logger.info("=== Handler Function Start ===");

            const request = buildCommonRequestObject(chaincodeFunction, chaincodeFunctionArgs);
            let result = await handlerFunction(request);
        
            logger.info("=== Handler Function End ===");  
            return resolve(result);
        } catch (err) {
            logger.error("Error: " + err);
            reject(Error(err));
        }
    });
    return promise;
};

module.exports = {handler};
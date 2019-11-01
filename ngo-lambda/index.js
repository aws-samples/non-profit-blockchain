/*
# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# 
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# or in the "license" file accompanying this file. This file is distributed 
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either 
# express or implied. See the License for the specific language governing 
# permissions and limitations under the License.
#
*/

/*
    A generic handler for executing Fabric chaincode functions
*/

'use strict';

const config = require("./config");
const {queryStringHandler, queryArrayHandler, queryObjectHandler} = require("./query");
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

/**
 * 
 * @param {*} event (Object)
 * {
 *      functionType: String, one of ['invoke','queryString','queryArray','queryObject']
 *      chaincodeFunction: String, name of the chaincode function to execute
 *      chaincodeFunctionArgs: Object, arguments to pass into the chaincode
 *      fabricUsername: String, username of the context in which to execute the chaincode function
 * }
 *      
 */
async function handler(event) {
    const promise = new Promise(async (resolve, reject) => {

        let functionType = event.functionType;
        let handlerFunction;

        if (functionType == "queryString") {
            handlerFunction = queryStringHandler;
        } else if (functionType == "queryArray") {
            handlerFunction = queryArrayHandler;
        } else if (functionType == "queryObject") {
            handlerFunction = queryObjectHandler;
        } else if (functionType == "invoke") {
            handlerFunction = invokeHandler;
        } else {
            return reject("functionType must be of type 'queryString', 'queryArray', 'queryObject' or 'invoke'");
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
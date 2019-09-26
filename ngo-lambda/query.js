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

'use strict';

const setupChannel = require("./setupChannel");
const logger = require("./logging").getLogger("query");

async function queryChaincode(request) {
    logger.info("=== Query Function Start ===");

    // send the query proposal to the peer
    let channel = await setupChannel();
	return channel.queryByChaincode(request)
    .then((query_responses) => {
        logger.info("Query has completed, checking results");
        // query_responses could have more than one  results if there multiple peers were used as targets
        if (query_responses && query_responses.length == 1) {
            if (query_responses[0] instanceof Error) {
                logger.error("error from query = ", query_responses[0]);
            } else {
                logger.info("query responses is " + query_responses);
                logger.info("Response is ", query_responses[0].toString());
                return query_responses[0].toString();
            }
        } else {
            logger.info("No payloads were returned from query");
        }
        logger.info("=== Query Function End ===");
    }).catch((err) => {
	    logger.error('Failed to query successfully :: ' + err);
    });
}

module.exports = queryChaincode;
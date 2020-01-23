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
const logger = require("./logging").getLogger("queryEvents");

async function queryEventsHandler(transactionId) {
    logger.info("=== Query Events Function Start ===");

    // send the query proposal to the peer
    let channel = await setupChannel();
	return channel.queryTransaction(transactionId)
    .then((processedTransaction) => {
        logger.info("Query events has completed, with result: ", processedTransaction);
        logger.info("=== Query Events Function End ===");
        return processedTransaction;
    }).catch((err) => {
        logger.error('Failed to query events successfully :: ' + err);
        throw err;
    });
}

module.exports = {
    queryEventsHandler
}
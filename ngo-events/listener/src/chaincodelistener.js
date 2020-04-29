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

// Starts a Fabric event hub listener to listen for chaincode events

'use strict';

const util = require('util');
const queue = require("./queue");
const config = require("./config");
const setupChannel = require('./setupChannel');

const logger = require("./logging").getLogger("EventListener");

const CHAINCODE_NAME = config.chaincodeName;
const EVENT_REGEX_STRING = config.eventRegexString;

let eventHub, registerId;

/* {
        "chaincode_id":"fabcar",
        "tx_id":"0c4f2da26ebb3c33afe58454bedea6405c4f22eb9ab16d2d241096b5c00c56bc",
        "event_name":"addCrateEvent",
        "payload":'{"createdAt":1577376880564,"createdByUser":null,"createdByMSPID":"Org1MSP","data":{},"locID":"CLI914"}'
    } 
*/
async function onEvent(event) {
    logger.info(`##### startChaincodeListener - onEvent - received '${event.chaincode_id}' event '${event.event_name}'`);
    const _event = {
        transactionId: event.tx_id,
        chaincode: event.chaincode_id,
        name: event.event_name,
        payload: "" + event.payload
    }
    logger.info('Received _event ', _event);
    await queue.putEvent(_event);
}

function onError(error) {
    logger.error('### - Error occurred listening to chaincode events: ' + error.stack ? error.stack : error);
    if (eventHub && registerId) {
      logger.info("### Deregistering the event listener.")
      eventHub.unregisterChaincodeEvent(registerId);
    }
    throw error;
}

const startListener = async function(channelName) {
	logger.info(util.format('\n============ START startChaincodeListener on channel %s ============\n', channelName));
	try {
        let channel = await setupChannel();
		// Register the chaincode listener. 
        eventHub = channel.newChannelEventHub(channel.getPeers()[0]);
        registerId = eventHub.registerChaincodeEvent(CHAINCODE_NAME, new RegExp(EVENT_REGEX_STRING, 'g'), onEvent, onError, {startBlock: 0});
        await eventHub.connect(true);
		logger.info(util.format('\n============ END startChaincodeListener - listener on channel %s started ============\n', channelName));

	} catch (error) {
		logger.error('##### startChaincodeListener - Error setting up client and registering block listener: ' + error.stack ? error.stack : error);
		throw error;
	}
}

exports.startListener = startListener;
/*
# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Starts a Fabric event hub listener to listen for new blocks
// Starts a websocket server to push notifications when new blocks arrive

'use strict';
var util = require('util');
var helper = require('./connection.js');
var logger = helper.getLogger('BlockListener');

var startBlockListener = async function(channelName, username, orgName, websocketServer) {
	logger.info(util.format('\n============ START startBlockListener on channel %s ============\n', channelName));
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(orgName, username);
		logger.info('##### startBlockListener - Successfully got the fabric client for the organization "%s"', orgName);
		var channel = client.getChannel(channelName);
		if(!channel) {
			let message = util.format('##### startBlockListener - Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}

		// Register a block listener. 
		//
		// This will return a list of channel event hubs when using a connection profile, 
		// based on the current organization defined in the currently active client section 
		// of the connection profile. Peers defined in the organization that have the eventSource 
		// set to true will be added to the list.
		let eventHubs = channel.getChannelEventHubsForOrg();
		logger.info('##### startBlockListener - found %s eventhubs for organization %s', eventHubs.length, orgName);

		eventHubs.forEach((eh) => {
			eh.registerBlockEvent((block) => {
				logger.info('##### startBlockListener - Successfully received the block event: %s', block);
				logger.info('##### startBlockListener - Block number: %s', block.header.number);
				logger.info('##### startBlockListener - Number of transactions in block: %s', block.data.data.length);
				var blockMsg = {
					blockNumber: block.header.number,
					txCount: block.data.data.length,
					txInBlock: []
				}
				let txCount = 0;
				block.data.data.forEach((tx) => {
					logger.info('##### startBlockListener - Transaction ID: %s', tx.payload.header.channel_header.tx_id);
					blockMsg['txInBlock'][txCount] = tx.payload.header.channel_header.tx_id;
					txCount++;
				})
				// Broadcast the new block to all websocket listeners
				websocketServer.broadcast = async function broadcast(msg) {
					logger.info('##### startBlockListener - websocket broadcast msg: %s', JSON.stringify(msg));
					websocketServer.clients.forEach(function each(client) {
						logger.info('##### startBlockListener - client.readyState: %s', client.readyState);
						if (client.readyState === 1) {
							logger.info('##### startBlockListener - Websocket is open');
							client.send(JSON.stringify(msg));
					  	}
					});
				};
				logger.info('##### startBlockListener - websocket starting to broadcast: %s', JSON.stringify(blockMsg));
				websocketServer.broadcast(blockMsg);
			}, (error)=> {
				logger.info('##### startBlockListener - Failed to receive the block event :: %s', error);
			});
			eh.connect(true);
		})
		logger.info(util.format('\n============ END startBlockListener - listener on channel %s started ============\n', channelName));

	} catch (error) {
		logger.error('##### startBlockListener - Error setting up client and registering block listener: ' + error.stack ? error.stack : error);
		error_message = error.toString();
	}
}

exports.startBlockListener = startBlockListener;

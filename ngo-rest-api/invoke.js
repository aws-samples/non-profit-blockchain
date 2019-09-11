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
var util = require('util');
var helper = require('./connection.js');
var logger = helper.getLogger('Invoke');

var invokeChaincode = async function(peerNames, channelName, chaincodeName, args, fcn, username, orgName) {
	logger.info(util.format('\n============ invokeChaincode - chaincode %s, function %s, on the channel \'%s\' for org: %s\n',
		chaincodeName, fcn, channelName, orgName));
	var error_message = null;
	var txIdAsString = null;
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(orgName, username);
		logger.info('##### invokeChaincode - Successfully got the fabric client for the organization "%s"', orgName);
		var channel = client.getChannel(channelName);
		if(!channel) {
			let message = util.format('##### invokeChaincode - Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}
		var txId = client.newTransactionID();
		txIdAsString = txId.getTransactionID();

		// send proposal to endorsing peers
		var request = {
			targets: peerNames,
			chaincodeId: chaincodeName,
			fcn: fcn,
			args: [JSON.stringify(args)],
			chainId: channelName,
			txId: txId
		};

		logger.info('##### invokeChaincode - Invoke transaction request to Fabric %s', JSON.stringify(request));
		let results = await channel.sendTransactionProposal(request);

		// the returned object has both the endorsement results
		// and the actual proposal, the proposal will be needed
		// later when we send a transaction to the ordering service
		var proposalResponses = results[0];
		var proposal = results[1];

		// lets have a look at the responses to see if they are
		// all good, if good they will also include signatures
		// required to be committed
		var successfulResponses = true;
		for (var i in proposalResponses) {
			let oneSuccessfulResponse = false;
			if (proposalResponses && proposalResponses[i].response &&
				proposalResponses[i].response.status === 200) {
				oneSuccessfulResponse = true;
				logger.info('##### invokeChaincode - received successful proposal response');
			} else {
				logger.error('##### invokeChaincode - received unsuccessful proposal response');
			}
			successfulResponses = successfulResponses & oneSuccessfulResponse;
		}

		if (successfulResponses) {
			logger.info(util.format(
				'##### invokeChaincode - Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
				proposalResponses[0].response.status, proposalResponses[0].response.message));

			// wait for the channel-based event hub to tell us
			// that the commit was good or bad on each peer in our organization
			var promises = [];
			let event_hubs = channel.getChannelEventHubsForOrg();
			event_hubs.forEach((eh) => {
				logger.info('##### invokeChaincode - invokeEventPromise - setting up event handler');
				let invokeEventPromise = new Promise((resolve, reject) => {
					let event_timeout = setTimeout(() => {
						let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
						logger.error(message);
						eh.disconnect();
					}, 10000);
					eh.registerTxEvent(txIdAsString, (tx, code, block_num) => {
						logger.info('##### invokeChaincode - The invoke chaincode transaction has been committed on peer %s',eh.getPeerAddr());
						logger.info('##### invokeChaincode - Transaction %s has status of %s in block %s', tx, code, block_num);
						clearTimeout(event_timeout);

						if (code !== 'VALID') {
							let message = util.format('##### invokeChaincode - The invoke chaincode transaction was invalid, code:%s',code);
							logger.error(message);
							reject(new Error(message));
						} else {
							let message = '##### invokeChaincode - The invoke chaincode transaction was valid.';
							logger.info(message);
							resolve(message);
						}
					}, (err) => {
						clearTimeout(event_timeout);
						logger.error(err);
						reject(err);
					},
						// the default for 'unregister' is true for transaction listeners
						// so no real need to set here, however for 'disconnect'
						// the default is false as most event hubs are long running
						// in this use case we are using it only once
						{unregister: true, disconnect: true}
					);
					eh.connect();
				});
				promises.push(invokeEventPromise);
			});

			var orderer_request = {
				txId: txId,
				proposalResponses: proposalResponses,
				proposal: proposal
			};
			var sendPromise = channel.sendTransaction(orderer_request);
			// put the send to the ordering service last so that the events get registered and
			// are ready for the orderering and committing
			promises.push(sendPromise);
			let results = await Promise.all(promises);
			logger.info(util.format('##### invokeChaincode ------->>> R E S P O N S E : %j', results));
			let response = results.pop(); //  ordering service results are last in the results
			if (response.status === 'SUCCESS') {
				logger.info('##### invokeChaincode - Successfully sent transaction to the ordering service.');
			} else {
				error_message = util.format('##### invokeChaincode - Failed to order the transaction. Error code: %s',response.status);
				logger.info(error_message);
			}

			// now see what each of the event hubs reported
			for(let i in results) {
				let event_hub_result = results[i];
				let event_hub = event_hubs[i];
				logger.info('##### invokeChaincode - Event results for event hub :%s',event_hub.getPeerAddr());
				if(typeof event_hub_result === 'string') {
					logger.info('##### invokeChaincode - ' + event_hub_result);
				} 
				else {
					if (!error_message) error_message = event_hub_result.toString();
					logger.info('##### invokeChaincode - ' + event_hub_result.toString());
				}
			}
		} 
		else {
			error_message = util.format('##### invokeChaincode - Failed to send Proposal and receive all good ProposalResponse. Status code: ' + 
				proposalResponses[0].status + ', ' + 
				proposalResponses[0].message + '\n' +  
				proposalResponses[0].stack);
			logger.info(error_message);
		}
	} 
	catch (error) {
		logger.error('##### invokeChaincode - Failed to invoke due to error: ' + error.stack ? error.stack : error);
		error_message = error.toString();
	}

	if (!error_message) {
		let message = util.format(
			'##### invokeChaincode - Successfully invoked chaincode %s, function %s, on the channel \'%s\' for org: %s and transaction ID: %s',
			chaincodeName, fcn, channelName, orgName, txIdAsString);
		logger.info(message);
		let response = {};
		response.transactionId = txIdAsString;
		return response;
	} 
	else {
		let message = util.format('##### invokeChaincode - Failed to invoke chaincode. cause:%s', error_message);
		logger.error(message);
		throw new Error(message);
	}
};

exports.invokeChaincode = invokeChaincode;

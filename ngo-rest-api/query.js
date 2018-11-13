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

var util = require('util');
var helper = require('./connection.js');
var logger = helper.getLogger('Query');

var queryChaincode = async function(peers, channelName, chaincodeName, args, fcn, username, org_name) {
	try {
		// first setup the client for this org
		var client = await helper.getClientForOrg(org_name, username);
		logger.info('============ START queryChaincode - Successfully got the fabric client for the organization "%s"', org_name);
		var channel = client.getChannel(channelName);
		if(!channel) {
			let message = util.format('##### queryChaincode - Channel %s was not defined in the connection profile', channelName);
			logger.error(message);
			throw new Error(message);
		}

		// send query
		var request = {
			targets : peers, 
			chaincodeId: chaincodeName,
			fcn: fcn,
			args: [JSON.stringify(args)]
		};

		logger.info('##### queryChaincode - Query request to Fabric %s', JSON.stringify(request));
		let response_payloads = await channel.queryByChaincode(request);
        let ret = [];
		if (response_payloads) {
            // you may received multiple response_payloads if you passed in multiple peers. For example,
            // if the targets : peers in the request above contained 2 peers, you should get 2 responses
			for (let i = 0; i < response_payloads.length; i++) {
                logger.info('##### queryChaincode - result of query: ' + response_payloads[i].toString('utf8') + '\n');
            }
            // we will only use the first response. We strip out the Fabric key and just return the payload
            let json = JSON.parse(response_payloads[0].toString('utf8'));
			logger.info('##### queryChaincode - Query json %s', util.inspect(json));
			if (Array.isArray(json)) {
				for (let key in json) {
					if (json[key]['Record']) {
						ret.push(json[key]['Record']); 
					} 
					else {
						ret.push(json[key]); 
					}
				}
			}
			else {
				ret.push(json); 
			}
 			return ret;
		} else {
			logger.error('##### queryChaincode - result of query, response_payloads is null');
			return 'response_payloads is null';
		}
	} catch(error) {
		logger.error('##### queryChaincode - Failed to query due to error: ' + error.stack ? error.stack : error);
		return error.toString();
	}
};

exports.queryChaincode = queryChaincode;

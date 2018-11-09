/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('Helper');

var path = require('path');
var util = require('util');

var hfc = require('fabric-client');
hfc.setLogger(logger);

async function getClientForOrg (userorg, username) {
	logger.info('============ START getClientForOrg for org %s and user %s', userorg, username);
    let config = '../tmp/connection-profile/ngo-connection-profile.yaml';
    let orgLower = userorg.toLowerCase();
    let clientConfig = '../tmp/connection-profile/' + orgLower + '/client-' + orgLower + '.yaml';

    logger.info('##### getClient - Loading connection profiles from file: %s and %s', config, clientConfig);

    // build a client context and load it with a connection profile
	// first load the network settings, then load the client specific settings
    let client = hfc.loadFromConfig(config);
    client.loadFromConfig(clientConfig);

	// this will create both the state store and the crypto store based
	// on the settings in the client section of the connection profile
	await client.initCredentialStores();

	// The getUserContext call tries to get the user from persistence.
	// If the user has been saved to persistence then that means the user has
	// been registered and enrolled. If the user is found in persistence
	// the call will then assign the user to the client object.
	if(username) {
		let user = await client.getUserContext(username, true);
		if(!user) {
			throw new Error(util.format('##### getClient - User was not found :', username));
		} else {
			logger.info('##### getClient - User %s was found to be registered and enrolled', username);
		}
	}
	logger.info('============ END getClientForOrg for org %s and user %s \n\n', userorg, username);

	return client;
}

var getRegisteredUser = async function(username, userOrg, isJson) {
	try {
		var client = await getClientForOrg(userOrg);
		logger.info('============ START getRegisteredUser - Successfully initialized the credential stores');
			// client can now act as an agent for organization Org1
			// first check to see if the user is already enrolled
		var user = await client.getUserContext(username, true);
		if (user && user.isEnrolled()) {
			logger.info('##### getRegisteredUser - Successfully loaded member from persistence: ' + username);
		} else {
			// user was not enrolled, so we will need an admin user object to register
			logger.info('##### getRegisteredUser - User %s was not enrolled, so we will need an admin user object to register',username);
			logger.info('##### getRegisteredUser - Got hfc %s', util.inspect(hfc));
			var admins = hfc.getConfigSetting('admins');
			logger.info('##### getRegisteredUser - Got admin property %s', util.inspect(admins));
			let adminUserObj = await client.setUserContext({username: admins[0].username, password: admins[0].secret});
			logger.info('##### getRegisteredUser - Got adminUserObj property %s', util.inspect(admins));
			let caClient = client.getCertificateAuthority();
			logger.info('##### getRegisteredUser - Got caClient %s', util.inspect(admins));
			let secret = await caClient.register({
				enrollmentID: username,
				affiliation: userOrg.toLowerCase() + '.department1'
			}, adminUserObj);
			logger.info('##### getRegisteredUser - Successfully got the secret for user %s',username);
			user = await client.setUserContext({username:username, password:secret});
			logger.info('##### getRegisteredUser - Successfully enrolled username %s  and setUserContext on the client object', username);
		}
		if(user && user.isEnrolled) {
			if (isJson && isJson === true) {
				var response = {
					success: true,
					secret: user._enrollmentSecret,
					message: username + ' enrolled Successfully',
				};
				return response;
			}
		} else {
			throw new Error('##### getRegisteredUser - User was not enrolled ');
		}
	} catch(error) {
		logger.error('##### getRegisteredUser - Failed to get registered user: %s with error: %s', username, error.toString());
		return 'failed '+error.toString();
	}

};


var setupChaincodeDeploy = function() {
	process.env.GOPATH = path.join(__dirname, hfc.getConfigSetting('CC_SRC_PATH'));
};

var getLogger = function(moduleName) {
	var logger = log4js.getLogger(moduleName);
	return logger;
};

exports.getClientForOrg = getClientForOrg;
exports.getLogger = getLogger;
exports.setupChaincodeDeploy = setupChaincodeDeploy;
exports.getRegisteredUser = getRegisteredUser;

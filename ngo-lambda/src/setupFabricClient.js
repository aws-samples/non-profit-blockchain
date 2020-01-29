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

const path = require("path");
const AWS = require('aws-sdk');
const Fabric_Client = require('fabric-client');
const config = require("./config");
const logger = require("./logging").getLogger("setupClient");

function getSecretIDForKey(keyName, username) {
    return "dev/fabricOrgs/" + config.memberName + "/" + username + "/" + keyName;
}

async function getSecret(keyName, username) {
    const client = new AWS.SecretsManager({
        region: "us-east-1"
    });
    
    return new Promise((resolve, reject) => {
        client.getSecretValue({SecretId: getSecretIDForKey(keyName, username)}, function(err, data) {
            if (err) {
                return reject(err);
            }

            if ('SecretString' in data) {
                secret = data.SecretString;
            } else {
                let buff = new Buffer(data.SecretBinary, 'base64');
                secret = buff.toString('ascii');
            }

            return resolve(secret);
        });
    });
}

async function setupClient() {
    
    logger.info("=== setupClient start ===");
    
	let fabric_client = Fabric_Client.loadFromConfig(path.join(__dirname, "./connection-profile.yaml"));

	const store_path = path.join(config.cryptoFolder);

	const crypto_suite = Fabric_Client.newCryptoSuite();
	const crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);

    const username = config.fabricUsername;
    const privatePEM = await getSecret("pk", username);
    const signedPEM = await getSecret("signcert", username);

	fabricUser = await fabric_client.createUser({username, mspid: config.mspID, cryptoContent: {privateKeyPEM: privatePEM, signedCertPEM: signedPEM}, skipPersistence: true});
    fabric_client.setUserContext(fabricUser, true);

    logger.info("=== setupClient end ===");

    return fabric_client;

}

module.exports = setupClient;
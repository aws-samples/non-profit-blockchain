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

let _clientInstance;

function getSecretIDForKey(keyName) {
    return "dev/fabricOrgs/" + config.memberName + "/" + config.fabricUsername + "/" + keyName;
}

async function getSecret(keyName) {
    const client = new AWS.SecretsManager({
        region: "us-east-1"
    });
    
    return new Promise((resolve, reject) => {
        logger.info("** about to call getsecretvalue");
        client.getSecretValue({SecretId: getSecretIDForKey(keyName)}, function(err, data) {
            logger.info("returning with err of " + err);
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

    if (!!_clientInstance) {
        logger.info("=== returning existing instance ===");
        return _clientInstance;
    } else {
        logger.info("=== not returning existing client instance ===");
    }

	let fabric_client = Fabric_Client.loadFromConfig(path.join(__dirname, "./ngo-connection-profile.yaml"));
	fabric_client.loadFromConfig(path.join(__dirname, "./client-org1.yaml"));

	const username = config.fabricUsername;
	const store_path = path.join(config.cryptoFolder);

	const crypto_suite = Fabric_Client.newCryptoSuite();
	const crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);
    logger.info("=== getting secrets ===");
    const privatePEM = await getSecret("pk");
    const signedPEM = await getSecret("signcert");
    logger.info("=== got secrets ===");
	fabricUser = await fabric_client.createUser({username, mspid: config.mspID, cryptoContent: {privateKeyPEM: privatePEM, signedCertPEM: signedPEM}, skipPersistence: true});
    logger.info("=== created iser ===");
    fabric_client.setUserContext(fabricUser, true);

    _clientInstance = fabric_client;

    logger.info("=== setupClient end ===");

    return fabric_client;

}

module.exports = setupClient;
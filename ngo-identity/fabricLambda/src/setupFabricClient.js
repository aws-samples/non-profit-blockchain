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
const fs = require("fs");
const AWS = require('aws-sdk');
const Fabric_Client = require('fabric-client');
const config = require("./config");
const logger = require("./logging").getLogger("setupClient");

const PS_KEY_CONNECTION_PROFILE = "/amb/" + process.env.NETWORK_ID + "/" + process.env.MEMBER_ID + "/connection-profile";

function getUserCertPSPath(username) {
    return "/amb/" + process.env.NETWORK_ID + "/" + process.env.MEMBER_ID + "/users/" + username;
}

function getUserPrivateKeySMPath(username) {
    return "/amb/" + process.env.NETWORK_ID + "/" + process.env.MEMBER_ID + "/users/" + username + "-priv";
}

async function getSecret(secretPath) {
    const client = new AWS.SecretsManager({
        region: "us-east-1"
    });
    
    return new Promise((resolve, reject) => {
        client.getSecretValue({SecretId: secretPath}, function(err, data) {
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

async function getParameter(parameterName) {
    AWS.config.apiVersions = {
        ssm: '2014-11-06'
    };
    const client = new AWS.SSM({
        region: "us-east-1"
    });
    
    return new Promise((resolve, reject) => {
        client.getParameter({Name: parameterName}, function(err, data) {
            if (err) {
                return reject(err);
            }

            return resolve(data.Parameter.Value);
        });
    });
}

async function setupClient() {
    
    logger.info("=== setupClient start ===");
    
    let connectionProfile = await getParameter(PS_KEY_CONNECTION_PROFILE);
    
    logger.debug("Writing connection profile to disk");

    const profileFilePath = "/tmp/connection-profile.yaml";
    fs.writeFileSync(profileFilePath, connectionProfile);
    let fabric_client = Fabric_Client.loadFromConfig(profileFilePath);

	const store_path = path.join(config.cryptoFolder);

	const crypto_suite = Fabric_Client.newCryptoSuite();
	const crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);

    const username = config.fabricUsername;
    const privatePEM = await getSecret(getUserPrivateKeySMPath(username));
    const signedPEM = await getParameter(getUserCertPSPath(username));
 
	fabricUser = await fabric_client.createUser({username, mspid: config.memberId, cryptoContent: {privateKeyPEM: privatePEM, signedCertPEM: signedPEM}, skipPersistence: true});
    fabric_client.setUserContext(fabricUser, true);

    logger.info("=== setupClient end ===");

    return fabric_client;

}

module.exports = setupClient;
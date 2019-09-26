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

const fs = require("fs");
const path = require("path");
const Fabric_Client = require('fabric-client');
const config = require("./config");

function getSecretIDForKey(keyName) {
    return "dev/fabricOrgs/" + config.memberName + "/" + config.fabricUsername + "/" + keyName;
}

async function getSecret(keyName) {
    const client = new AWS.SecretsManager({
        region: "us-east-1"
    });
    
    return new Promise((resolve, reject) => {
        client.getSecretValue({SecretId: getSecretIDForKey(keyName)}, function(err, data) {
            if (err) {
                return reject(err);
            }

            if ('SecretString' in data) {
                secret = data.SecretString;
            } else {
                let buff = new Buffer(data.SecretBinary, 'base64');
                secret = buff.toString('ascii');
            }

            console.log("secret is " + secret);
            return resolve(secret);
        });
    });
}

async function setupCrypto() {
    
	let fabric_client = Fabric_Client.loadFromConfig(path.join(__dirname, "./ngo-connection-profile.yaml"));
	fabric_client.loadFromConfig(path.join(__dirname, "./client-org1.yaml"));

	const username = config.fabricUsername;
	const store_path = path.join(config.cryptoFolder);

	const crypto_suite = Fabric_Client.newCryptoSuite();
	const crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);

    const privatePEM = await getSecret("pk");
    const signedPEM = await getSecret("signcert");

	fabricUser = await fabric_client.createUser({username, mspid: config.mspID, cryptoContent: {privateKeyPEM: privatePEM, signedCertPEM: signedPEM}, skipPersistence: true});
	fabric_client.setUserContext(fabricUser, true);

    return { fabric_client };

}

async function setupChannel(client) {
    let channel = client.getChannel(config.channelName, false);
    if (channel == null) {
        channel = client.newChannel(config.channelName);
    }

    let peer = channel.getPeers()[0];
    const pemfile = fs.readFileSync(path.resolve(__dirname, "./certs/managedblockchain-tls-chain.pem"), "utf8");

    if (!peer) {
        let peerEndpoints = config.peerEndpoint.split(",");
        for (let i in peerEndpoints) {
            channel.addPeer(client.newPeer(peerEndpoint[i], {pem:pemfile}));
            // Additional peer settings: https://fabric-sdk-node.github.io/Channel.html#addPeer__anchor
        }
    }

    const order = client.newOrderer(config.ordererEndpoint, {pem:pemfile})
    channel.addOrderer(order);
    return channel;
}

module.exports = setupChannel;
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
const config = require("./config");
const setupClient = require("./setupFabricClient");
const logger = require("./logging").getLogger("setupChannel");

async function setupChannel() {

    logger.info("=== setupChannel start ===");

    let client = await setupClient();

    let channel = client.getChannel(config.channelName, false);
    if (channel == null) {
        channel = client.newChannel(config.channelName);
    }

    let peer = channel.getPeers()[0];
    const pemfile = fs.readFileSync(path.resolve(__dirname, "./certs/managedblockchain-tls-chain.pem"), "utf8");

    if (!peer) {
        let peerEndpoints = config.peerEndpoint.split(",");
        for (let i in peerEndpoints) {
            channel.addPeer(client.newPeer(peerEndpoints[i], {pem:pemfile}));
            // Additional peer settings: https://fabric-sdk-node.github.io/Channel.html#addPeer__anchor
        }
    }

    let orderer = channel.getOrderers()[0];
    if (!orderer) {
        orderer = client.newOrderer(config.ordererEndpoint, {pem:pemfile})
        channel.addOrderer(orderer);
    }

    logger.info("=== setupChannel end ===");
    return channel;
}

module.exports = setupChannel;
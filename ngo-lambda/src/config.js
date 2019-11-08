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

let configObject = {
    "caEndpoint": process.env.CA_ENDPOINT || "localhost:7054",
    "peerEndpoint": process.env.PEER_ENDPOINT || "grpc://localhost:7051",
    "ordererEndpoint": process.env.ORDERER_ENDPOINT || "grpc://localhost:7050",
    "channelName": process.env.CHANNEL_NAME || "mychannel",
    "chaincodeId": process.env.CHAIN_CODE_ID || "ngo",
    "cryptoFolder": process.env.CRYPTO_FOLDER || '/tmp',
    "mspID": process.env.MSP || 'm-1A2B3CXXXXXXXX',
    "memberName": process.env.MEMBERNAME || "org1"
}

module.exports = configObject;
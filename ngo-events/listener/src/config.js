let configObject = {
    "logLevel": process.env.LOG_LEVEL || 'debug',
    "chaincodeName": process.env.CHAINCODE_NAME || 'ngo',
    "channelName": process.env.CHANNEL_NAME || "mychannel",
    "eventRegexString" : process.env.EVENT_REGEX_STRING || '.*',
    "peerEndpoint": process.env.PEER_ENDPOINT || "grpc://localhost:7051",
    "ordererEndpoint": process.env.ORDERER_ENDPOINT || "grpc://localhost:7050",
    "fabricUsername": process.env.FABRIC_USERNAME || 'Admin',
    "mspID": process.env.MSP || 'Org1MSP',
    "SQSQueueURL": process.env.SQS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/1234567890/loc-events-dev',
    "cryptoFolder": process.env.CRYPTO_FOLDER || '/tmp',
    "memberName": process.env.MEMBER_NAME || 'org1'
}

module.exports = configObject;
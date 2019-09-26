let configObject = {
    "caEndpoint": process.env.CA_ENDPOINT || "localhost:7054",
    "peerEndpoint": process.env.PEER_ENDPOINT || "grpc://localhost:7051",
    "ordererEndpoint": process.env.ORDERER_ENDPOINT || "grpc://localhost:7050",
    "channelName": process.env.CHANNEL_NAME || "mychannel",
    "chaincodeId": process.env.CHAIN_CODE_ID || "ngo",
    "cryptoFolder": process.env.CRYPTO_FOLDER || '/tmp',
    "mspID": process.env.MSP || 'm-1A2B3CXXXXXXXX',
    "memberName": process.env.MEMBERNAME || "org1",
    'fabricUsername': process.env.FABRICUSER || 'lambdaUser'
}

module.exports = configObject;
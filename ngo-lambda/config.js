let configObject = {
    "caEndpoint": process.env.CA_ENDPOINT || "http://localhost:7054",
    "peerEndpoint": process.env.PEER_ENDPOINT || "grpc://localhost:7051",
    "ordererEndpoint": process.env.ORDERER_ENDPOINT || "grpc://localhost:7050",
    "channelName": process.env.CHANNEL_NAME || "mychannel",
    "chaincodeId": process.env.CHAIN_CODE_ID || "fabfarming",
    "s3AccessKeyId": process.env.S3_ACCESS_KEY_ID || "accesskeyid",
    "s3SecretAccessKey": process.env.S3_SECRET_ACCESS_KEY || "secretaccesskey",
    "s3CryptoBucket": process.env.S3_CRYPTO_BUCKET || "cryptobucketname",
    "cryptoFolder": process.env.CRYPTO_FOLDER || '/tmp',
    "mspID": process.env.MSP_ID || 'Org1MSPID',
    'fabricUsername': process.env.FABRIC_USERNAME || 'fabricLambdaUser'
}

module.exports = configObject;
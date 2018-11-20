# Facilitator instructions

The facilitator will need to create the channel, install and instantiate the chaincode, and test that
the chaincode can be queried and invoked.

SSH into the EC2 instance you are using to configure the Fabric network.

## Pre-requisites

You will need to set the context before carrying out any Fabric CLI commands.

```
export MSP_PATH=/opt/home/admin-msp
export MSP=esxh3vewtnhsrldv5du3p52zpq
export ORDERER=orderer.uqz2f2xakfd7vcfewqhckr7q5m.taiga.us-east-1.amazonaws.com:30001
export PEER=3p5k6tloxrgchjvz6lt2rmyhta.esxh3vewtnhsrldv5du3p52zpq.uqz2f2xakfd7vcfewqhckr7q5m.taiga.us-east-1.amazonaws.com:30003
```

## Step 1 - clone the repo containing the chaincode

```
cd
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

## Step 2 - copy the chaincode into the CLI container

The CLI container mounts a folder from the EC2 instance: /home/ec2-user/fabric-samples/chaincode
You should already have this folder on your EC2 instance as it was created earlier. Copying the 
chaincode into this folder will make it accessible inside the CLI container.

```
cd
mkdir ./fabric-samples/chaincode/ngo
cp ./non-profit-blockchain/ngo-chaincode/src/* ./fabric-samples/chaincode/ngo
```

## Step 3 - install the chaincode on your peer

Notice we are using the `-l node` flag, as our chaincode is written in Node.js.

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" -e "CORE_PEER_LOCALMSPID=$MSP" -e  "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER"  cli peer chaincode install -n ngo -l node -v v0 -p /opt/gopath/src/github.com/ngo
```

Expected response:

```
2018-11-15 06:39:47.625 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-11-15 06:39:47.625 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
2018-11-15 06:39:47.625 UTC [container] WriteFolderToTarPackage -> INFO 003 rootDirectory = /opt/gopath/src/github.com/ngo
2018-11-15 06:39:47.636 UTC [chaincodeCmd] install -> INFO 004 Installed remotely response:<status:200 payload:"OK" >
```

## Step 4 - instantiate the chaincode on the channel

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" -e "CORE_PEER_LOCALMSPID=$MSP" -e  "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER"  cli peer chaincode instantiate -o $ORDERER -C mychannel -n ngo -v v0 -c '{"Args":["init"]}' --cafile /opt/home/taiga-tls.pem --tls
```

Expected response:
(Note this might fail if the chaincode has been previously instantiated. Chaincode only needs to be
instantiated once on a channel)

```
2018-11-15 06:41:02.847 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-11-15 06:41:02.847 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
```

## Step 5 - query the chaincode

Query all donors
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" -e "CORE_PEER_ADDRESS=$PEER"  -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" cli peer chaincode query -C mychannel -n ngo -c '{"Args":["queryAllDonors"]}'
```

Query a specific donor
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" -e "CORE_PEER_ADDRESS=$PEER"  -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" cli peer chaincode query -C mychannel -n ngo -c '{"Args":["queryDonor","{\"donorUserName\": \"edge\"}"]}'
```

## Step 6 - invoke a transaction

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" -e "CORE_PEER_ADDRESS=$PEER"  -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" cli peer chaincode invoke -C mychannel -n ngo -c  '{"Args":["createDonor","{\"donorUserName\": \"edge\", \"email\": \"edge@def.com\", \"registeredDate\": \"2018-10-22T11:52:20.182Z\"}"]}' -o $ORDERER --cafile /opt/home/taiga-tls.pem --tls
```
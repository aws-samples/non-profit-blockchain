# Part 2: NGO Chaincode

The instructions in this README will help you to install the NGO chaincode into the
Fabric network you created in [Part 1](../ngo-fabric/README.md)

All steps are carried out on the Fabric client node you created in [Part 1](../ngo-fabric/README.md)

## Pre-requisites

From Cloud9, SSH into the Fabric client node. The key (i.e. the .PEM file) should be in your home directory. 
The DNS of the Fabric client node EC2 instance can be found in the output of the CloudFormation stack you 
created in [Part 1](../ngo-fabric/README.md)

```
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

You should have already cloned this repo in [Part 1](../ngo-fabric/README.md)

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

You will need to set the context before carrying out any Fabric CLI commands. We do this 
using the export files that were generated for us in [Part 1](../ngo-fabric/README.md)

Source the file, so the exports are applied to your current session. If you exit the SSH 
session and re-connect, you'll need to source the file again. The `source` command below
will print out the values of the key ENV variables. Make sure they are all populated. If
they are not, follow Step 4 in [Part 1](../ngo-fabric/README.md) to repopulate them:

```
cd ~/non-profit-blockchain/ngo-fabric
source fabric-exports.sh
```

Check the peer export file exists and that it contains a number of export keys with values:

```
cat ~/peer-exports.sh 
```
If the file has values for all keys, source it:

```
source ~/peer-exports.sh 
```

## Step 1 - Copy the chaincode into the CLI container

The Fabric CLI container that is running on your Fabric client node (do `docker ps` to see it)
mounts a folder from the Fabric client node EC2 instance: /home/ec2-user/fabric-samples/chaincode.
You can see this by looking at the docker config. Look at the `Mounts` section in the output where
you'll see `/home/ec2-user/fabric-samples/chaincode` mounted into the Docker container:

```
docker inspect cli
```

You should already have this folder on your Fabric client node as it was created earlier. Copying the 
chaincode into this folder will make it accessible inside the Fabric CLI container.

```
cd ~
mkdir -p ./fabric-samples/chaincode/ngo
cp ./non-profit-blockchain/ngo-chaincode/src/* ./fabric-samples/chaincode/ngo
```

## Step 2 - Install the chaincode on your peer

Before executing any chaincode functions, the chaincode must be installed on the peer node. Chaincode
must be installed on every peer that wants to invoke transactions or run the query functions in the
chaincode.

Notice we are using the `-l node` flag, as our chaincode is written in Node.js.

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" \
    -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER"  \
    cli peer chaincode install -n ngo -l node -v v0 -p /opt/gopath/src/github.com/ngo
```

Expected response:

```
2018-11-15 06:39:47.625 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-11-15 06:39:47.625 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
2018-11-15 06:39:47.625 UTC [container] WriteFolderToTarPackage -> INFO 003 rootDirectory = /opt/gopath/src/github.com/ngo
2018-11-15 06:39:47.636 UTC [chaincodeCmd] install -> INFO 004 Installed remotely response:<status:200 payload:"OK" >
```

## Step 3 - Instantiate the chaincode on the channel

Instantiation initlizes the chaincode on the channel, i.e. it binds the chaincode to a specific channel.
Instantiation is treated as a Fabric transaction. In fact, when chaincode is instantiated, the Init function
on the chaincode is called. Instantiation also sets the endorsement policy for this version of the chaincode
on this channel. In the example below we are not explictly passing an endorsement policy, so the default
policy of 'any member of the organizations in the channel' is applied.

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" \
    -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER"  \
    cli peer chaincode instantiate -o $ORDERER -C mychannel -n ngo -v v0 -c '{"Args":["init"]}' --cafile /opt/home/taiga-tls.pem --tls
```

Expected response:
(Note this might fail if the chaincode has been previously instantiated. Chaincode only needs to be
instantiated once on a channel)

```
2018-11-15 06:41:02.847 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-11-15 06:41:02.847 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
```

## Step 4 - Query the chaincode

Query all donors
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" \
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
cli peer chaincode query -C mychannel -n ngo -c '{"Args":["queryAllDonors"]}'
```

Expected response:
This is correct as we do not have any donors in our network yet. We'll add one in the next step.

```
[]
```

## Step 5 - Invoke a transaction

Let's add a couple of donors to Fabric. Execute both of these transactions below:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" \
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
cli peer chaincode invoke -C mychannel -n ngo \
-c  '{"Args":["createDonor","{\"donorUserName\": \"edge\", \"email\": \"edge@def.com\", \"registeredDate\": \"2018-10-22T11:52:20.182Z\"}"]}' -o $ORDERER --cafile /opt/home/taiga-tls.pem --tls

docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" \
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
cli peer chaincode invoke -C mychannel -n ngo \
-c  '{"Args":["createDonor","{\"donorUserName\": \"braendle\", \"email\": \"braendle@def.com\", \"registeredDate\": \"2018-11-05T14:31:20.182Z\"}"]}' -o $ORDERER --cafile /opt/home/taiga-tls.pem --tls
```

## Step 6 - Query the chaincode

Query all donors
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" \
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
cli peer chaincode query -C mychannel -n ngo -c '{"Args":["queryAllDonors"]}'
```

Query a specific donor
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/taiga-tls.pem" \
-e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
cli peer chaincode query -C mychannel -n ngo -c '{"Args":["queryDonor","{\"donorUserName\": \"edge\"}"]}'
```

## Move on to Part 3
The workshop instructions can be found in the README files in parts 1-4:

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the AWS Managed Blockchain Hyperledger Fabric network.
* [Part 2:](../ngo-chaincode/README.md) Deploy the NGO chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the REST API. 
* [Part 4:](../ngo-ui/README.md) Run the Application. 

# Part1: Build a Hyperledger Fabric blockchain network using Amazon Managed Blockchain

This section will build a Hyperledger Fabric blockchain network using Amazon Managed Blockchain. A combination of AWS CloudFormation, the AWS Console and the AWS CLI will be used. The process to create the network is as follows:

* Provision an AWS Cloud9 instance. We will use the Linux terminal that Cloud9 provides
* From Cloud9, run an AWS CloudFormation template to create a Fabric network and provision a peer node in Amazon Managed Blockchain 
* From Cloud9, run an AWS CloudFormation template to provision a VPC and a Fabric client node. You 
will use the Fabric client node to administer the Fabric network
* From the Fabric client node, create a Fabric channel, install and instantiate chaincode, and 
query and invoke transactions on the Fabric network

## Pre-requisites - AWS Cloud9
We will use AWS Cloud9 to provide a Linux terminal which has the AWS CLI already installed.

1. Spin up a [Cloud9 IDE](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1) from the AWS console.
In the Cloud9 console, click 'Create Environment'. Using 'us-east-1' for the region will be easier.
2. Provide a name for your environment, e.g. fabric-c9, and click **Next Step**
3. Select `Other instance type`, then select `t2.medium` and click **Next Step**
4. Click **Create environment**. It would typically take 30-60s to create your Cloud9 IDE
5. In the Cloud9 terminal, in the home directory, clone this repo:

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

Update your AWS CLI to the latest version.

```
sudo pip install awscli --upgrade
```

## Step 1 - Create the Hyperledger Fabric blockchain network
Use Cloud9 to create a Fabric network using the provided CloudFormation template.

In your Cloud9 terminal window:

```
export REGION=us-east-1
export STACKNAME=non-profit-amb
cd ~/non-profit-blockchain/ngo-fabric
./amb.sh
```

The CloudFormation template, `amb.yaml`, expects a number of parameters. All of these have default values for the purpose
of this workshop, but can be overridden in the script `amb.sh`. The template defaults to creating a 'Starter' Fabric network
with a single small peer node. This would not be suitable for a production network, which would need a 'Standard' Fabric
network with multiple peer nodes spread across AZs.

## Step 2 - Check the network is AVAILABLE
Before continuing, check to see that your Fabric network has been created and is Available. It does take quite a while
to create the network, so grab a coffee in the meantime. You will need an Available network before continuining with the 
next steps.

You can check the status of your network in two places:

* In the AWS CloudFormation Console: https://console.aws.amazon.com/cloudformation. Check the resources for your stack. You
are waiting for the member and the peer node to be CREATE_COMPLETE
* In the Amazon Managed Blockchain Console: https://console.aws.amazon.com/managedblockchain. For you network, you are waiting
for the network, the member and the member's peer node to be Available.

Once your Managed Blockchain network is available, move on to the next step.

## Step 3 - Create the Fabric client node
In your Cloud9 terminal window.

Create the Fabric client node, which will host the Fabric CLI. You will use the CLI to administer
the Fabric network. The Fabric client node will be created in its own VPC in your AWS account, with VPC endpoints 
pointing to the Fabric network you created in Step 1 above. AWS CloudFormation will be used to create the Fabric 
client node, the VPC and the VPC endpoints. Note that the CloudFormation template includes an AMI that is available in us-east-1 only. If you want to run this workshop in a different AWS region, you will need to copy the AMI to your region and replace the AMI ID in the CloudFormation template. 

The AWS CloudFormation template requires a number of parameter values. The script you run below will make sure these 
are available as export variables before calling CloudFormation. 

If you see the following error when running the script below: `An error occurred (InvalidKeyPair.NotFound)`, ignore it.
This is caused by the script creating a keypair, and ensuring it does not overwrite it if it does exist.

In Cloud9:

```
export REGION=us-east-1
cd ~/non-profit-blockchain/ngo-fabric
./vpc-client-node.sh
```

Check the progress in the AWS CloudFormation console and wait until the stack is CREATE COMPLETE.
You will find some useful information in the Outputs tab of the CloudFormation stack once the stack
is complete. We will use this information in later steps.

## Step 4 - Prepare the Fabric client node and enroll an identity
On the Fabric client node.

Prior to executing any commands on the Fabric client node, you will need to export ENV variables
that provide a context to Hyperledger Fabric. These variables will tell the client node which Fabric
network to use, which peer node to interact with, which TLS certs to use, etc. 

From Cloud9, SSH into the Fabric client node. The key (i.e. the .PEM file) should be in your home directory. 
The DNS of the Fabric client node EC2 instance can be found in the output of the CloudFormation stack you 
created in Step 3 above.

Answer 'yes' if prompted: `Are you sure you want to continue connecting (yes/no)`

```
cd ~
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

Clone the repo:

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

In future steps you will need to refer to different configuration values in your Fabric network. In this step
we export these values so you don't need to copy them from the console, or look them up elsewhere. Source the file 
that includes the ENV export values that define your Fabric network configuration so that the exports are applied 
to your current session. If you exit the SSH session and re-connect, you'll need to source the file again.

```
export REGION=us-east-1
cd ~/non-profit-blockchain/ngo-fabric
cp templates/exports-template.sh fabric-exports.sh
source fabric-exports.sh
source ~/peer-exports.sh 
```

Sourcing the file will do two things:
* export the necessary ENV variables
* create another file which contains the export values you need to use when working with a Fabric peer node.
This can be found in the file: `~/peer-exports.sh`, which we also source here.

Check the `source` worked. You should see values for both of the ENV variables below:

```
$ echo $PEERSERVICEENDPOINT
nd-4MHB4EKFCRF7VBHXZE2ZU4F6GY.m-B7YYBFY4GREBZLPCO2SUS4GP3I.n-WDG36TTUD5HEJORZUPF4REKMBI.managedblockchain.us-east-1.amazonaws.com:30003

$ echo $MSP
m-MKPVAFNPQ5BV7ADVZ4MP2QWA3M
```

For interest, you can check that the peer export file exists and that it contains a number of export keys with values:

```
cat ~/peer-exports.sh 
```

Get the latest version of the Managed Blockchain PEM file. This will overwrite the existing file in the home directory with the latest version of this file:

```
aws s3 cp s3://us-east-1.managedblockchain/etc/managedblockchain-tls-chain.pem  /home/ec2-user/managedblockchain-tls-chain.pem
```

Enroll an admin identity with the Fabric CA (certificate authority). We will use this
identity to administer the Fabric network and perform tasks such as creating channels
and instantiating chaincode.

```
export PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin
cd ~
fabric-ca-client enroll -u https://$ADMINUSER:$ADMINPWD@$CASERVICEENDPOINT --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M /home/ec2-user/admin-msp 
```

Some final copying of the certificates is necessary:

```
mkdir -p /home/ec2-user/admin-msp/admincerts
cp ~/admin-msp/signcerts/* ~/admin-msp/admincerts/
cd ~/non-profit-blockchain/ngo-fabric
```

## Step 5 - Update the configtx channel configuration
On the Fabric client node.

Update the configtx channel configuration. The Name and ID fields should be updated with the member ID from Managed Blockchain.

```
cp ~/non-profit-blockchain/ngo-fabric/configtx.yaml ~
sed -i "s|__MEMBERID__|$MEMBERID|g" ~/configtx.yaml
```

Generate the configtx channel configuration by executing the following script. When the channel is created, this channel configuration will become the genesis block (i.e. block 0) on the channel:

```
docker exec cli configtxgen -outputCreateChannelTx /opt/home/$CHANNEL.pb -profile OneOrgChannel -channelID $CHANNEL --configPath /opt/home/
```

You should see:

```
2018-11-26 21:41:22.885 UTC [common/tools/configtxgen] main -> INFO 001 Loading configuration
2018-11-26 21:41:22.887 UTC [common/tools/configtxgen] doOutputChannelCreateTx -> INFO 002 Generating new channel configtx
2018-11-26 21:41:22.887 UTC [common/tools/configtxgen/encoder] NewApplicationGroup -> WARN 003 Default policy emission is deprecated, please include policy specificiations for the application group in configtx.yaml
2018-11-26 21:41:22.887 UTC [common/tools/configtxgen/encoder] NewApplicationOrgGroup -> WARN 004 Default policy emission is deprecated, please include policy specificiations for the application org group m-BHX24CQGP5CUNFS3YZTO2MPSRI in configtx.yaml
2018-11-26 21:41:22.888 UTC [common/tools/configtxgen] doOutputChannelCreateTx -> INFO 005 Writing new channel tx
```

Check that the channel configuration has been generated:

```
ls -lt ~/$CHANNEL.pb 
```

## Step 6 - Create a Fabric channel
On the Fabric client node.

Create a Fabric channel.

Execute the following script:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer channel create -c $CHANNEL -f /opt/home/$CHANNEL.pb -o $ORDERER --cafile $CAFILE --tls --timeout 900s
```

You should see:

```
2018-11-26 21:41:29.684 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2018-11-26 21:41:29.752 UTC [cli/common] readBlock -> INFO 002 Got status: &{NOT_FOUND}
2018-11-26 21:41:29.761 UTC [channelCmd] InitCmdFactory -> INFO 003 Endorser and orderer connections initialized
2018-11-26 21:41:29.963 UTC [cli/common] readBlock -> INFO 004 Got status: &{NOT_FOUND}
2018-11-26 21:41:29.972 UTC [channelCmd] InitCmdFactory -> INFO 005 Endorser and orderer connections initialized
2018-11-26 21:41:30.174 UTC [cli/common] readBlock -> INFO 006 Got status: &{NOT_FOUND}
2018-11-26 21:41:34.370 UTC [cli/common] readBlock -> INFO 026 Received block: 0
```

This will create a file called `mychannel.block` in the CLI container in the directory `/opt/home/fabric-samples/chaincode/hyperledger/fabric/peer`. Since this directory is mounted from the host
Fabric client node, you can see the block file here:

```
ls -lt /home/ec2-user/fabric-samples/chaincode/hyperledger/fabric/peer
```

If the channel creation times out, it's possible that the channel has still been created and you can get 
the block from the channel itself. Executing the command below will read the channel config and save the
genesis block in the same directory as mentioned above:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem"  \
    -e "CORE_PEER_ADDRESS=$PEER"  -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer channel fetch oldest /opt/home/fabric-samples/chaincode/hyperledger/fabric/peer/$CHANNEL.block \
    -c $CHANNEL -o $ORDERER --cafile /opt/home/managedblockchain-tls-chain.pem --tls   
```

Check that the block file now exists:

```
ls -lt /home/ec2-user/fabric-samples/chaincode/hyperledger/fabric/peer
```

## Step 7 - Join your peer node to the channel
On the Fabric client node.

Join peer to Fabric channel.

Execute the following script:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer channel join -b $CHANNEL.block  -o $ORDERER --cafile $CAFILE --tls
```

You should see:

```
2018-11-26 21:41:40.983 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2018-11-26 21:41:41.022 UTC [channelCmd] executeJoin -> INFO 002 Successfully submitted proposal to join channel
```

## Step 8 - Install chaincode on your peer node
On the Fabric client node.

Install chaincode on Fabric peer.

Execute the following script:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode install -n $CHAINCODENAME -v $CHAINCODEVERSION -p $CHAINCODEDIR
```

You should see:

```
2018-11-26 21:41:46.585 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-11-26 21:41:46.585 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
2018-11-26 21:41:48.004 UTC [chaincodeCmd] install -> INFO 003 Installed remotely response:<status:200 payload:"OK" > 
```

## Step 9 - Instantiate the chaincode on the channel
On the Fabric client node.

Instantiate chaincode on Fabric channel. This statement may take around 30 seconds, and you
won't see a specific success response.

Execute the following script:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode instantiate -o $ORDERER -C $CHANNEL -n $CHAINCODENAME -v $CHAINCODEVERSION \
    -c '{"Args":["init","a","100","b","200"]}' --cafile $CAFILE --tls
```

You should see:

```
2018-11-26 21:41:53.738 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-11-26 21:41:53.738 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
```

## Step 10 - Query the chaincode
On the Fabric client node.

Query the chaincode on Fabric peer.

Execute the following script:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["query","a"]}' 
```

You should see:

```
100
```

## Step 11 - Invoke a transaction
On the Fabric client node.

Invoke a Fabric transaction.

Execute the following script:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode invoke -o $ORDERER -C $CHANNEL -n $CHAINCODENAME \
    -c '{"Args":["invoke","a","b","10"]}' --cafile $CAFILE --tls
```

You should see:

```
2018-11-26 21:45:20.935 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 001 Chaincode invoke successful. result: status:200 
```

## Step 12 - Query the chaincode again and check the change in value
On the Fabric client node.

Query the chaincode on the Fabric peer and check the change in value. This proves the success of the invoke
transaction. If you execute the query immediately after the invoke, you may notice that the data hasn't changed.
Any idea why? There should be a gap of (roughly) 2 seconds between the invoke and query.

Invoking a transaction in Fabric involves a number of steps, including:

* Sending the transaction to the endorsing peers for simulation and endorsement
* Packaging the endorsements from the peers
* Sending the packaged endorsements to the ordering service for ordering
* The ordering service grouping the transactions into blocks (which are created every 2 seconds, by default)
* The ordering service sending the blocks to all peer nodes for validating and committing to the ledger

Only after the transactions in the block have been committed to the ledger can you read the
new value from the ledger (or more specifically, from the world state key-value store).

Execute the following script:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer chaincode query -C $CHANNEL -n $CHAINCODENAME -c '{"Args":["query","a"]}' 
```

You should see:

```
90
```

## Move on to Part 2
The workshop instructions can be found in the README files in parts 1-4:

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../ngo-chaincode/README.md) Deploy the non-profit chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the RESTful API server. 
* [Part 4:](../ngo-ui/README.md) Run the application. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 
* [Part 6:](../ngo-lambda/README.md) Read and write to the blockchain with AWS Lambda.
* [Part 7:](../ngo-events/README.md) Use blockchain events to notify users of NGO donations.
* [Part 8:](../blockchain-explorer/README.md) Deploy Hyperledger Explorer. 
* [Part 9:](../ngo-identity/README.md) Integrating blockchain users with Amazon Cognito.
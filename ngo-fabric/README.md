# Part1: Setup a Fabric network

This section will create an AWS Managed Blockchain Fabric network. A combination of the AWS Console and the AWS CLI 
will be used. The process to create the network is as follows:

* Provision a Cloud9 instance. We will use the Linux terminal that Cloud9 provides
* Use the AWS Managed Blockchain console to create a Fabric network and provision a peer node
* From Cloud9, run a CloudFormation template to provision a VPC and a Fabric client node. You 
will use the Fabric client node to administer the Fabric network
* From the Fabric client node, create a Fabric channel, install & instantiate chaincode, and 
query and invoke transactions on the Fabric network

## Pre-requisites - Cloud9
We will use Cloud9 to provide a Linux terminal which has the AWS CLI already installed.

1. Spin up a [Cloud9 IDE](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1) from the AWS console.
In the Cloud9 console, click 'Create Environment'. Using 'us-east-1' for the region will be easier.
2. Provide a name for your environment, e.g. fabric-c9, and click **Next Step**
3. Select `Other instance type`, then select `t2-medium` and click **Next Step**
4. Click **Create environment**. It would typically take 30-60s to create your Cloud9 IDE
5. In the Cloud9 terminal, in the home directory, clone this repo:

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

Download the model file for the new AWS Managed Blockchain service. This is a temporary step
and will not be required once the `managedblockchain` service has been included in the latest CLI.

```
cd ~
aws s3 cp s3://managedblockchain-beta/service-2.json .  
aws configure add-model --service-model file://service-2.json --service-name managedblockchain
```

## Step 1 - Create the Fabric network
In the AWS Managed Blockchain Console: https://console.aws.amazon.com/managedblockchain

Make sure you are in the correct AWS region (i.e. us-east-1, also known as N. Virginia) and follow the steps below:

1. Click `Create a Network`
2. Make sure `Hyperleger Fabric 1.2` is selected
3. Enter a network name and an optional description, and click `Next`
4. Enter a member name (e.g. this could be the name of the organisation you belong to) and an optional description
5. Enter an admin username and password, and note this down. You will need it later. Click `Next`
6. Check your configuration and click `Create network and member`
7. Wait until the status of your network and your network member become ACTIVE.

Before continuing, check to see that your Fabric network has been created and is ACTIVE. If not,
wait for it to complete. Otherwise the steps below may fail.

## Step 2 - Create the Fabric Peer
In the AWS Managed Blockchain Console: https://console.aws.amazon.com/managedblockchain

1. In the new network you have created, click on the member in the Members section.
2. Click `Create peer node`
3. Enter 20 for storage, accept the other defaults, and click `Create peer node`

We'll continue with the next steps while we wait for the peer node to become HEALTHY.

## Step 3 - Create the Fabric client node
In your Cloud9 terminal window.

Create the Fabric client node, which will host the Fabric CLI. You will use the CLI to administer
the Fabric network. The Fabric client node will be created in its own VPC, with VPC endpoints 
pointing to the Fabric network you created in [Part 1](../ngo-fabric/README.md). CloudFormation 
will be used to create the Fabric client node, the VPC and the VPC endpoints.

The CloudFormation template requires a number of parameter values. We'll make sure these 
are available as export variables before running the script below.

In Cloud9:

```
export REGION=us-east-1
export NETWORKID=<the network ID you created in Step1, from the AWS Managed Blockchain Console>
export NETWORKNAME=<the name you gave the network>
```

Set the VPC endpoint. Make sure it has been populated and exported. If the `echo` statement below shows
that it's blank, check the details under your network in the AWS Managed Blockchain Console: 

```
export VPCENDPOINTSERVICENAME=$(aws managedblockchain get-network --region $REGION --network-id $NETWORKID --query 'Network.VpcEndpointServiceName' --output text)
echo $VPCENDPOINTSERVICENAME
```

If the VPC endpoint is populated with a value, go ahead and run this script. This will create the
CloudFormation stack:

```
cd ~/non-profit-blockchain/ngo-fabric
./3-vpc-client-node.sh
```

Check the progress in the AWS CloudFormation console and wait until the stack is CREATE COMPLETE.

## Step 4 - Prepare the Fabric client node and enroll and identity
On the Fabric client node.

Prior to executing any commands in the Fabric client node, you will need to export ENV variables
that provide a context to Hyperledger Fabric. These variables will tell the client node which peer
node to interact with, which TLS certs to use, etc. 

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

Create the file that includes the ENV export values that define your Fabric network configuration.

```
cd ~/non-profit-blockchain/ngo-fabric
cp templates/exports-template.sh fabric-exports.sh
vi fabric-exports.sh
```

Update the export statements at the top of the file. The info you need either matches what you 
entered when creating the Fabric network in [Part 1](../ngo-fabric/README.md), or can be found 
in the AWS Managed Blockchain Console, under your network.

Source the file, so the exports are applied to your current session. If you exit the SSH 
session and re-connect, you'll need to source the file again.

```
cd ~/non-profit-blockchain/ngo-fabric
source fabric-exports.sh
```

Sourcing the file will do two things:
* export the necessary ENV variables
* create another file which contains the export values you need to use when working with a Fabric peer node.
This can be found in the file: `~/peer-exports.sh`. You will see how to use this in a later step.

Check the `source` worked:

```
$ echo $PEERSERVICEENDPOINT
nd-4MHB4EKFCRF7VBHXZE2ZU4F6GY.m-B7YYBFY4GREBZLPCO2SUS4GP3I.n-WDG36TTUD5HEJORZUPF4REKMBI.managedblockchain.us-east-1.amazonaws.com:30003
```

Check the peer export file exists and that it contains a number of export keys with values:

```
cat ~/peer-exports.sh 
```

If the file has values for all keys, source it:

```
source ~/peer-exports.sh 
```

Enroll an admin identity with the Fabric CA (certificate authority). We will use this
identity to administer the Fabric network and perform tasks such as creating channels
and instantiating chaincode.

```
cd ~/non-profit-blockchain/ngo-fabric
./4-enroll-member-admin.sh
```

## Step 5 - Update the configtx channel configuration
On the Fabric client node.

Update the configtx channel configuration. The Name and ID fields should be updated with the member ID. 
You can obtain the member ID from the AWS Managed Blockchain Console, or from the ENV variables 
exported to your current session.

```
echo $MEMBERID
```

Update the configtx.yaml file. Make sure you edit the configtx.yaml file you copied to your home
directory, NOT the one in the repo:

```
cp ~/non-profit-blockchain/ngo-fabric/configtx.yaml ~
vi ~/configtx.yaml
```

Generate the configtx channel configuration

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./5-configtx.sh
```

You should see:

```
$ ./5-configtx.sh
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
cd ~/non-profit-blockchain/ngo-fabric
./6-channel.sh
```

You should see:

```
$ ./6-channel.sh
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
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem"  -e "CORE_PEER_ADDRESS=$PEER"  -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" cli peer channel fetch oldest /opt/home/fabric-samples/chaincode/hyperledger/fabric/peer/$CHANNEL.block -c $CHANNEL -o $ORDERER --cafile /opt/home/managedblockchain-tls-chain.pem --tls   
```

## Step 7 - Join your peer node to the channel
On the Fabric client node.

Join peer to Fabric channel.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./7-join.sh
```

You should see:

```
$ ./7-join.sh
2018-11-26 21:41:40.983 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2018-11-26 21:41:41.022 UTC [channelCmd] executeJoin -> INFO 002 Successfully submitted proposal to join channel
```

## Step 8 - Install chaincode on your peer node
On the Fabric client node.

Install chaincode on Fabric peer.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./8-install.sh
```

You should see:

```
$ ./8-install.sh
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
cd ~/non-profit-blockchain/ngo-fabric
./9-instantiate.sh
```

You should see:

```
$ ./9-instantiate.sh
2018-11-26 21:41:53.738 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2018-11-26 21:41:53.738 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
```

## Step 10 - Query the chaincode
On the Fabric client node.

Query the chaincode on Fabric peer.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./10-query.sh
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
cd ~/non-profit-blockchain/ngo-fabric
./11-invoke.sh
```

You should see:

```
$ ./11-invoke.sh
2018-11-26 21:45:20.935 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 001 Chaincode invoke successful. result: status:200 
```

## Step 12 - Query the chaincode again and check the change in value
On the Fabric client node.

Query the chaincode on Fabric peer and check the change in value.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./10-query.sh
```

You should see:

```
90
```

## Move on to Part 2
The workshop instructions can be found in the README files in parts 1-4:

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the AWS Managed Blockchain Hyperledger Fabric network.
* [Part 2:](../ngo-chaincode/README.md) Deploy the NGO chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the REST API. 
* [Part 4:](../ngo-ui/README.md) Run the Application. 

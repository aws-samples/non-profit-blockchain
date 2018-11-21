# Setup a Fabric network

This section will create a Fabric network. A combination of the AWS Console and the AWS CLI 
will be used.

## Pre-requisites - Cloud9
We will use Cloud9 to provide a Linux shell.

1. Spin up a [Cloud9 IDE](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1) from the AWS console.
In the Cloud9 console, click 'Create Environment'
2. Provide a name for your environment, e.g. fabric-c9, and click **Next Step**
3. Leave everything as default and click **Next Step**
4. Click **Create environment**. It would typically take 30-60s to create your Cloud9 IDE
5. In the Cloud9 terminal, in the home directory, clone this repo:

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

## Step 1 - Create the Fabric network
In the AWS Managed Blockchain Console.

Make sure you are in the correct AWS region and follow the steps below:

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

1. In the new network you have created, select the member in the Members section.
2. Click `Create peer node`
3. Enter 40 for storage, accept the other defaults, and click `Create peer node`

We'll continue with the next steps while we wait for the peer node to become HEALTHY.

## Step 3 - create the Fabric client node
In your Cloud9 terminal window.

Create the Fabric client node, which will host the Fabric CLI. You will use the CLI to administer
the Fabric network. The Fabric client node will be created in its own VPC, with VPC endpoints 
pointing to the Fabric network you created in Step 1. CloudFormation will be used to create the
Fabric client node.

The CloudFormation script requires a small number of parameter values. We'll make sure these 
are available before running the script.

In Cloud9:

```
export ENDPOINT=https://taiga-beta.us-east-1.amazonaws.com
export REGION=us-east-1
export NETWORKID=<the network ID you created in Step1, from the AWS Managed Blockchain Console>
```

Make sure the VPC endpoint has been populated: 

```
export VPCENDPOINTSERVICENAME=$(aws managedblockchain get-network --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --query 'Network.VpcEndpointServiceName' --output text)
```

If the VPC endpoint is populated with a value, go ahead and run this script. This will create the
CloudFormation stack:

```
cd ~/non-profit-blockchain/ngo-fabric
./3-vpc-client-node.sh
```

Check the progress in the AWS CloudFormation console

## Step 4 - prepare the Fabric client node and enroll and identity
On the Fabric client node.

Prior to executing any commands in the Fabric client node, you will need to export ENV variables
that provide a context to Hyperledger Fabric. These variables will tell the client node which peer
node to interact with, which TLS certs to use, etc. 

From Cloud9, SSH into the Fabric client node. The key should be in your home directory. The DNS of the
EC2 instance can be found in the output of the CloudFormation stack.

```
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

Clone the repo:

```
cd
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

Create the file that includes the ENV export values that define your Fabric network configuration.

```
cd ~/non-profit-blockchain/ngo-fabric
cp templates/exports-template.sh fabric-exports.sh
vi fabric-exports.sh
```

Update the export statements at the top of the file. The info you need either matches what you 
entered when creating the Fabric network in Step 1, or can be found in the AWS Managed Blockchain Console,
under your network.

Source the file, so the exports are applied to your current session. If you exit the SSH 
session and re-connect, you'll need to source the file again.

```
cd ~/non-profit-blockchain/ngo-fabric
source fabric-exports.sh
```

Sourcing the file will do two things:
* export the necessary ENV variables
* create another file which contains the export values you need to use when working with a Fabric peer node.
This can be found in the file: peer-exports.sh. You will see how to use this in a later step.

Check the `source` worked:

```
$ echo $PEERSERVICEENDPOINT
nd-4MHB4EKFCRF7VBHXZE2ZU4F6GY.m-B7YYBFY4GREBZLPCO2SUS4GP3I.n-WDG36TTUD5HEJORZUPF4REKMBI.managedblockchain.us-east-1.amazonaws.com:30003
```

Check the peer export file exists and that is contains a number of export keys with values:

```
cat peer-exports.sh
```

Enroll an admin identity with the Fabric CA (certificate authority). We will use this
identity when we create the peer node in a later step.

```
cd ~/non-profit-blockchain/ngo-fabric
./4-enroll-member-admin.sh
```

## Step 5 - update the configtx channel configuration
On the Fabric client node.

Update the configtx channel configuration:

```
cp ~/non-profit-blockchain/ngo-fabric/configtx.yaml ~
vi ~/configtx.yaml
```

Update the Name and ID fields with the member ID. You can obtain the member ID from the AWS 
Managed Blockchain Console.

Generate the configtx channel configuration

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./5-configtx.sh
```

## Step 6 - in Fabric client node
On the Fabric client node.

Create a Fabric channel.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./6-channel.sh
```

## Step 7 - in Fabric client node
On the Fabric client node.

Join peer to Fabric channel.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./7-join.sh
```

## Step 8 - in Fabric client node
On the Fabric client node.

Install chaincode on Fabric peer.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./8-install.sh
```

## Step 9 - in Fabric client node
On the Fabric client node.

Instantiate chaincode on Fabric channel.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./9-instantiate.sh
```

## Step 10 - in Fabric client node
On the Fabric client node.

Query the chaincode on Fabric peer.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./10-query.sh
```

## Step 11 - in Fabric client node
On the Fabric client node.

Invoke a Fabric transaction.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./11-invoke.sh
```

## Step 10 - in Fabric client node
On the Fabric client node.

Query the chaincode on Fabric peer and check the change in value.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./10-query.sh
```

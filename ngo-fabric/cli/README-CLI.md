# Setup a Fabric network via the AWS CLI

This section will create a Fabric network using the AWS CLI.

## Pre-requisites - AWS Cloud9
We will use AWS Cloud9 to provide a Linux shell.

1. Spin up a [Cloud9 IDE](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1) from the AWS console.
In the Cloud9 console, click 'Create Environment'
2. Provide a name for your environment, e.g. fabric-c9, and click **Next Step**
3. Leave everything as default and click **Next Step**
4. Click **Create environment**. It would typically take 30-60s to create your Cloud9 IDE
5. In the Cloud9 terminal, in the home directory, clone this repo:

```
cd
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

## Step 0 - in Cloud9
Configure your Fabric network name and other items.

The config for your Fabric network can be configured in the file `0-exports.sh`. This file
exports ENV vars used by the other scripts. If you exit your session and need to restart,
you can source this file again. Some statements in the file may fail, depending on how far along
the process your are of creating your Fabic network (I.e. some components may not exist yet), but
the script will export the values it can find.

You may need to edit this file and add in the `NETWORKID` and `NETWORKMEMBERID`, if you have
already created the Fabric network.

```
cd ~/non-profit-blockchain/ngo-fabric
vi 0-exports.sh
```

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
source ./0-exports.sh
```

## Step 1 - in Cloud9
Create the Fabric network. 

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./1-fabric-network.sh
```

## Step 2 - in Cloud9
Create the Fabric client node, which will host the Fabric CLI. You will use the CLI to administer
the Fabric network. The Fabric client node will be created in its own VPC, with VPC endpoints 
pointing to the Fabric network you created in [Part 1](../ngo-fabric/README.md)

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./2-vpc-client-node.sh
```

Check the progress in the AWS CloudFormation console

## Step 3 - SSH into the EC2 Fabric client node
Setup the Fabric client node. This step installs the necessary packages.

SSH into the Fabric client node. The key should be in your home directory. The DNS of the
EC2 instance can be found in the output of the CloudFormation stack.

```
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

Clone the repo:

```
cd
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./3a-client-node-setup.sh
```

Now exit your SSH session and reconnect.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./3b-client-node-setup.sh
```

Now exit your SSH session.

## Step 4 - in Cloud9
Make sure you are back in Cloud9.

Create the Fabric peer.

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./4-fabric-peer.sh
```

## Step 5 - first in Cloud9, then in Fabric client node
Prior to executing any commands in the Fabric client node, you will need to export ENV variables
that provide a context to Hyperledger Fabric. These variables will tell the client node which peer
node to interact with, which TLS certs to use, etc. 

I will generate all the required export variables in Cloud9. You will need to copy the output to
the client node as explained below.

In Cloud9:

```
source ./0-exports.sh
```

Find the section titled 'Exports to be used on client node'. Copy all the export commands under this 
section using ctrl-c. The exports you copy should look something like this:

```
export MSP_PATH=/opt/home/admin-msp
export MSP=m-U2UK2RBNQBBMFAZVJPAACYQOEQ
export ORDERER=orderer.n-ZX2IFPESDJB67NMOV4VK5HEFL4.managedblockchain.us-east-1.amazonaws.com:30001
export PEER=nd-N6FEBJD4IRALNCLNVYUGOWQV5M.m-ZSKQNOCTFFAM3JZNRBRLO735II.n-ZX2IFPESDJB67NMOV4VK5HEFL4.managedblockchain.us-east-1.amazonaws.com:30003
export CHANNEL=mychannel
export CAFILE=/opt/home/managedblockchain-tls-chain.pem
export CHAINCODENAME=mycc
export CHAINCODEVERSION=v0
export CHAINCODEDIR=github.com/chaincode_example02/go
```

In the Fabric client node.

SSH into the client node. Edit the peer export file:

```
cd ~/non-profit-blockchain/ngo-fabric
vi peer-exports.sh
```

Delete all the contents and paste the contents you copied from Cloud9. Then source the file:

```
source ./peer-exports.sh
```

Generate the configtx channel configuration

Execute the following script:

```
cd ~/non-profit-blockchain/ngo-fabric
./5-configtx.sh
```

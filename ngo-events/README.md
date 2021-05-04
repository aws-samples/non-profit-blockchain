# Part 7: Use blockchain events to notify users of NGO donations

Blockchain events allow us to build event-based applications that respond to changes in the smart contracts and the blockchain network.  These events can be used for real time analytics with [Amazon Kinesis Data Streams](https://aws.amazon.com/kinesis/data-streams/), or can be sent to AWS purpose built databases like [Amazon DynamoDB](https://aws.amazon.com/dynamodb/) for faster query times or [Amazon Aurora](https://aws.amazon.com/rds/aurora/) for more complex querying.  In this workshop, we will use blockchain events and [Amazon Simple Notification Service (SNS)](https://aws.amazon.com/sns/) to notify us when a donation has been made.  


Hyperledger Fabric has three types of events (https://hyperledger.github.io/fabric-sdk-node/release-1.4/tutorial-channel-events.html) that allow us to monitor blockchain network activity.

- Block events - these are triggered when a new block gets added to the ledger.  These events contain information about the transactions that were included in the block.
- Transaction events - these are triggered when a transaction has been committed to the ledger.
- Chaincode events - these are custom events created by the chaincode developer and contained within the chaincode.  Chaincode events are triggered when the block containing the transaction is committed to the ledger.

In our NGO donation application we will be listening for chaincode events that indicate a donation has been has made.  We will then send an SMS notifying the user of this donation.

## Pre-requisites
 There are multiple parts to the workshop.  Before starting on Part 7, you should have completed [Part 1](../ngo-fabric/README.md) and [Part 2](../ngo-chaincode/README.md).

 In the AWS account where you [created the Fabric network](../ngo-fabric/README.md), use Cloud9 to SSH into the Fabric client node. The key (i.e. the .PEM file) should be in your home directory. The DNS of the Fabric client node EC2 instance can be found in the output of the CloudFormation stack you created in [Part 1](../ngo-fabric/README.md).

```
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

You should have already cloned this repo in [Part 1](../ngo-fabric/README.md).

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

You will need to set the context before carrying out any Fabric CLI commands. You do this 
using the export files that were generated for us in [Part 1](../ngo-fabric/README.md).

Source the file, so the exports are applied to your current session. If you exit the SSH 
session and re-connect, you'll need to source the file again. The `source` command below
will print out the values of the key ENV variables. Make sure they are all populated. If
they are not, follow Step 4 in [Part 1](../ngo-fabric/README.md) to repopulate them:

```
cd ~/non-profit-blockchain/ngo-fabric
source fabric-exports.sh
source ~/peer-exports.sh 
```

## Solution Overview

This architecture diagram illustrates the solution you will be building.

![Architecture Diagram](./Architecture%20Diagram.png)

The blockchain listener is a Node.js application that is packaged into a Docker image and runs in an [Amazon Fargate](https://aws.amazon.com/fargate/) cluster.  The Docker image is stored in [Amazon Elastic Container Registry (ECR)](https://aws.amazon.com/ecr/).  When an event is created, the listener publishes this event to an [Amazon Simple Queue Service (SQS)](https://aws.amazon.com/sqs/) queue.  An [Amazon Lambda](https://aws.amazon.com/lambda/) function processes messages from this queue and triggers an SNS notification to send the SMS.  The Fargate cluster runs within a private subnet, which we also create in this exercise.

Lastly, we will upgrade our [Fabric chaincode](./chaincode/src/ngo.js) to emit a chaincode event when a donation has been made.  This is done using the Node.js Fabric SDK.  Here is a snippet of the function that handles this:

```
function createEvent(stub, data = {}) {
  const eventObject = {
      createdAt: (new Date()).getTime(),
      createdBy: data.donor,
      donationAmount: data.amount,
      ngoRegistrationNumber: data.ngo
  }
  stub.setEvent(data.eventName, Buffer.from(JSON.stringify(eventObject)));
}
```

## Solution Steps 

The steps you will execute in this part are:

1. Create a Fabric user to listen for peer events
2. Deploy the Node.js listener in a Docker image to ECR
3. Deploy the SQS queue
4. Deploy the Elastic Container Service (ECS) cluster that will host the Fargate task
5. Deploy the ECS Fargate task to run the listener
6. Create an SNS topic with an SMS subscription
7. Deploy the Lambda function to call SNS for every event
8. Upgrade the chaincode


## Step 1 - Create listener user
On the Fabric client node.

The listener will need to connect to the peer node to listen for events.  Execute this script to create a Fabric user called `listenerUser` that will be used by the listener.

```
~/non-profit-blockchain/ngo-events/scripts/createFabricUser.sh
```

## Step 2 - Upload a Docker image of the listener to ECR
In this step we create a Docker image of the Node.js event listener and upload the image to ECR.  The ECS cluster will download and run this image.

Create and upload the image to ECR by running the script:

```
~/non-profit-blockchain/ngo-events/scripts/deployImage.sh
```

## Steps 3-5 - Create a private subnet, the SQS queue and ECS cluster
The VPC created in [Part 1](../ngo-fabric/README.md) contains a public subnet, but we want to run our ECS cluster in a private subnet since it does not need to be accessible from the outside world.  The script we run in this step creates a private subnet, an SQS queue and the ECS cluster.

Create all the components by running the script: 

```
~/non-profit-blockchain/ngo-events/scripts/deployListener.sh
```

We now have a listener running as a Fargate task that is listening for blockchain events and publishing every event to SQS. This allows us to handle these events using a Lambda function. We could also invoke other AWS services from the Lambda function, for example, we could write the blockchain event data to DynamoDB or S3 to deliver faster query times and drive Amazon Quicksight dashboards.  In this workshop, we'll use SNS to send an SMS notifying the recipient of the new donation.  

## Steps 6-7 Create an SNS subscription and Lambda function
Before we create the SNS subscription, let's set the phone number we want to use to receive the SMS messages.  Set this environment variable to your mobile number, and include the country code.  For example, in the U.S. this would be something like `+15555555555`.

```
export PHONENUMBER=<your mobile number>
```

Create the SNS subscription and Lambda function by running the script: 

```
~/non-profit-blockchain/ngo-events/scripts/deployHandler.sh
```

## Step 8 - upgrade the NGO chaincode
The final step is to update the NGO chaincode by adding the chaincode event. Copy the chaincode to the directory where the Fabric CLI container expects to find the chaincode source code.

```
cp ~/non-profit-blockchain/ngo-events/chaincode/src/* ~/fabric-samples/chaincode/ngo
```

Install the chaincode on the peer node.

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER" cli peer chaincode install -n ngo -l node -v v1 -p /opt/gopath/src/github.com/ngo
```

If this is successful you should see a message like this:

```
INFO 004 Installed remotely response:<status:200 payload:"OK" >
```

Next, upgrade the chaincode.

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER" cli peer chaincode upgrade -o $ORDERER -C mychannel -n ngo -v v1 -c '{"Args":[""]}' --cafile /opt/home/managedblockchain-tls-chain.pem --tls
```

# Testing

## Make a donation
Now that we've created everything, let's see it all in action.

We'll begin by creating an NGO to which we will donate:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" cli peer chaincode invoke -C mychannel -n ngo -c  '{"Args":["createNGO","{\"ngoRegistrationNumber\": \"1234\", \"ngoName\": \"Animal Shelters\", \"ngoDescription\": \"We help pets in need\", \"address\": \"123 Pet Street\", \"contactNumber\":\"55555555\", \"contactEmail\":\"animal@animals.com\"}"]}' -o $ORDERER --cafile /opt/home/managedblockchain-tls-chain.pem --tls
```

If this is successful you should see a message like this:

```
INFO 001 Chaincode invoke successful. result: status:200
```

Next, we'll donate to this NGO by invoking the `createDonation` method of our chaincode:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" cli peer chaincode invoke -C mychannel -n ngo -c '{"Args":["createDonation","{\"donationId\": \"9999\", \"donationAmount\": \"100\", \"donationDate\": \"2020-03-22T11:52:20.182Z\", \"donorUserName\": \"edge\", \"ngoRegistrationNumber\":\"1234\"}"]}' -o $ORDERER --cafile /opt/home/managedblockchain-tls-chain.pem --tls
```

If this is successful you should see a message like this:

```
INFO 001 Chaincode invoke successful. result: status:200
```

Now check your phone. You should receive a message reflecting the donation you have just made.

You now have a Fabric event listener running as a Fargate task in ECS that publishes Fabric events to SQS.  A Lambda function processes the SQS messages and triggers SNS notifcations, sending SMS messages to your mobile device.

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../ngo-chaincode/README.md) Deploy the non-profit chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the RESTful API server. 
* [Part 4:](../ngo-ui/README.md) Run the application. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 
* [Part 6:](../ngo-lambda/README.md) Read and write to the blockchain with Amazon API Gateway and AWS Lambda.
* [Part 7:](../ngo-events/README.md) Use blockchain events to notify users of NGO donations.
* [Part 8:](../blockchain-explorer/README.md) Deploy Hyperledger Explorer. 
* [Part 9:](../ngo-identity/README.md) Integrating blockchain users with Amazon Cognito.
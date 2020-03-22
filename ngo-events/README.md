# Part 7: Blockchain events to notify users of new donations

In this part we will use blockchain events and Amazon Simple Notification Service to notify us when a donation has been made.  Blockchain events allow external applications to listen for and be notified of activity occurring within the smart contracts and the blockchain network.

Hyperledger Fabric has three types of events (https://hyperledger.github.io/fabric-sdk-node/release-1.4/tutorial-channel-events.html) that allow us to monitor blockchain network activity.

- Block events - these are triggered when a new block gets added to the ledger.  These event contain information about the transactions that were included in the block.
- Transaction events - these are triggered when a transaction has been committed to the ledger.
- Chaincode events - these are custom events created by the chaincode developer and contained within the chaincode.  Chaincode events are triggered when the block containing the invoking transaction is committed to the ledger.

In our NGO donation application we will be listening for a chaincode event indicating a donation has been has made.

## Pre-requisites
 There are multiple parts to the workshop.  Before starting on Part 7, you should have completed [Part 1](../ngo-fabric/README.md), [Part 2](../ngo-chaincode/README.md) and  [Part 6](../ngo-lambda/README.md).

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

The blockchain listener is a Node.js application that is packaged into a Docker image and runs in an Amazon Fargate cluster.  The Docker image is stored in Amazon Elastic Container Registry (ECR).  When an event is created, the listener will put this event on an Amazon Simple Queue Service (SQS) queue.  An Amazon Lambda function will process messages from this queue and will trigger SNS to send the notification.

## Solution Steps 

The steps you will execute in this part are:

1. Build the listener into a Docker image and put it on ECR
2. Create a Fabric user to listen for the events
2. Deploy an SQS queue
3. Deploy an Elastic Container Service (ECS) Task that runs this image
4. Deploy the ECS Task in a Fargate cluster

5. Deploy an SNS subscription and topic
6. Deploy a Lambda function that calls SNS for each event
7. Upgrade the chaincode to emit events when a donation has been made

Steps 1-5 will be deployed within a single script.
Steps 2-5 will be deployed together within a single Cloudformation template.
Step 6 will be done via the Fabric client node.

## Step 0 - Create listener user
```
~/non-profit-blockchain/ngo-events/scripts/createFabricUser.sh
```

## Step 1 - Create and upload a Docker image for the listener
On the Fabric client node.

Create the Docker image and upload it to ECR by running the script: 

```
~/non-profit-blockchain/ngo-events/createImage.sh
```

## Steps 2-4 Deploy SQS, SNS and ECS Fargate
Create all the components by running the script: 

```
~/non-profit-blockchain/ngo-events/deployListener.sh
```

## Steps 5-6 Deploy SNS and Lambda
Create all the components by running the script: 

```
~/non-profit-blockchain/ngo-events/deployHandler.sh
```

## Step 6 - upgrade the NGO chaincode
We will use the docker cli image to upgrade the chaincode.

Copy it.
```
cd ~
cp ./non-profit-blockchain/ngo-events/chaincode/src/* ./fabric-samples/chaincode/ngo
```

Install it on the peer node.
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER" cli peer chaincode install -n ngo -l node -v v1 -p /opt/gopath/src/github.com/ngo
```

Upgrade it.
```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER" cli peer chaincode upgrade -o $ORDERER -C mychannel -n ngo -v 2.0 -c '{"Args":[""]}' --cafile /opt/home/managedblockchain-tls-chain.pem --tls
```

# Testing

## Make a donation


```
docker cli command that creates a donation
```

If this is successful you should see a message indicating:

```
Lambda creation completed. API Gateway is active at:
https://abcd12345.execute-api.us-east-1.amazonaws.com/dev
```

The URL is to the API Gateway which we will test with in step 4. It is also available as an output of the CloudFormation stack created in this step (look for the name `fabric-lambda-stack`). Copy the URL and paste it in a local text editor to reference it later.

## Step 3 - Test the Lambda function

You can test the Lambda function from the [Lambda console](https://console.aws.amazon.com/lambda), or from the cli.

To test from the cli, you will execute the commands below.  The output of each command is in the file specified in the last argument, and is displayed via `cat`.

First, call the `createDonor` chaincode function to create the donor "melissa".
```
aws lambda invoke --function-name $LAMBDANAME --payload "{\"fabricUsername\":\"$FABRICUSER\",\"functionType\":\"invoke\",\"chaincodeFunction\":\"createDonor\",\"chaincodeFunctionArgs\":{\"donorUserName\":\"melissa\",\"email\":\"melissa@melissasngo.org\"}}" --region $REGION /tmp/lambda-output-createDonor.txt
cat /tmp/lambda-output-createDonor.txt
```

Next, call the `queryDonor` function to view the details of the donor we just created.
```
aws lambda invoke --function-name $LAMBDANAME --payload "{\"fabricUsername\":\"$FABRICUSER\",\"functionType\":\"queryObject\",\"chaincodeFunction\":\"queryDonor\",\"chaincodeFunctionArgs\":{\"donorUserName\":\"melissa\"}}" --region $REGION /tmp/lambda-output-queryDonor.txt
cat /tmp/lambda-output-queryDonor.txt
```

Finally, call the `queryAllDonors` function to view all the donors.
```
aws lambda invoke --function-name $LAMBDANAME --payload "{\"fabricUsername\":\"$FABRICUSER\",\"functionType\":\"queryObject\",\"chaincodeFunction\":\"queryAllDonors\",\"chaincodeFunctionArgs\":{}}" --region $REGION /tmp/lambda-output-queryAllDonors.txt
cat /tmp/lambda-output-queryAllDonors.txt
```

You have deployed a Lambda function that is invoking chaincode transactions and running queries in Managed Blockchain. Next we'll test using API Gateway to call this Lambda for each of its routes.

## Step 4 - Test the API Gateway

You can test the API Gateway from the [API Gateway console](https://console.aws.amazon.com/apigateway), or from the cli.  We will walk through testing it from the cli.

To test from the cli, you will execute the commands below.  

First, call the `POST /donors` endpoint which will execute the `createDonor` chaincode function to create the donor "rachel".

```
export APIURL=$(aws cloudformation describe-stacks --stack-name fabric-lambda-stack --query "Stacks[0].Outputs[?OutputKey=='APIGatewayURL'].OutputValue" --output text --region $REGION)
curl -s -X POST "$APIURL/donors" -H "content-type: application/json" -d '{"donorUserName":"rachel","email":"rachel@donor.org"}'
```

Second, call the `GET /donors/{donorName}` endpoint which will execute the `queryDonor` chaincode function to query the donor "rachel".

```
curl -s -X GET "$APIURL/donors/rachel" 
```

Finally, call the `GET /donors` endpoint which will execute the `queryAllDonors` chaincode function to view all the donors.

```
curl -s -X GET "$APIURL/donors" 
```

You now have a REST API managed by API Gateway that is invoking a Lambda function to execute transactions on the blockchain.  To expose additional chaincode functions within API Gateway, you would add API Gateway routes to support them, and continue routing to the same Lambda function.   

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../ngo-chaincode/README.md) Deploy the non-profit chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the RESTful API server. 
* [Part 4:](../ngo-ui/README.md) Run the application. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 
* [Part 6:](../ngo-lambda/README.md) Read and write to the blockchain with Amazon API Gateway and AWS Lambda.

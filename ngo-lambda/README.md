# Part 6: Read and write to the blockchain with Amazon API Gateway and AWS Lambda

Part 6 will show you how to publish a REST API with API Gateway and Lambda that invokes chaincode on a Hyperledger Fabric blockchain network running on Amazon Managed Blockchain.  You will use the NodeJS Hyperledger Fabric SDK within the Lambda function to interface with the blockchain.

## Pre-requisites
 There are multiple parts to the workshop.  Before starting on Part 6, you should have completed [Part 1](../ngo-fabric/README.md) and [Part 2](../ngo-chaincode/README.md).

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

## Overview

The steps you will execute in this part are:

1. Create the Fabric user
2. Deploy the Lambda function and API Gateway
3. Test the Lambda function
4. Test the API Gateway

This architecture diagram illustrates how the Lambda function and API Gateway you will build and deploy fits within the overall architecture.

![Architecture Diagram](./Lambda%20API%20AMB%20Workshop%20Diagram.png)

## Step 1 - Create the Fabric user
On the Fabric client node.

Register and enroll an identity with the Fabric Certificate Authority (CA). You will use this identity within the Lambda function. In the example below you are creating a user named `lambdaUser` with a password of `Welcome123`.  The password is optional and one will be generated if not provided.  Enrolling the new user will download the credentials from Fabric CA and store them in the temporary folders `/tmp/certs/lambdaUser/keystore` and `/tmp/certs/lambdaUser/signcerts`. From there they will be written as secrets to AWS Secrets Manager.

Set environment variables for the username and password of the Fabric user you will be creating.

```
export FABRICUSER=lambdaUser
export FABRICUSERPASSWORD=Welcome123
```

Execute this script to register and enroll the Fabric user, and upload the credentials to AWS Secrets Manager.

```
~/non-profit-blockchain/ngo-lambda/createFabricUser.sh
```

## Step 2 - Deploy the Lambda function and API Gateway

The Lambda function will run within your VPC so it can access the VPC Endpoint to the Managed Blockchain service. The Lambda function is designed to support calling any function that is available in the chaincode installed on your Fabric peers. In the examples below you will call a single Lambda function which will invoke different chaincode functions depending on the arguments you pass to the Lambda. This simplifies adding higher level interfaces like API Gateway to execute blockchain transactions. The API Gateway will translate REST requests into Lambda function executions, and the Lambda function will invoke the appropriate chaincode function.

We will also need to create a new VPC Endpoint to allow the VPC hosting our Lambda to communicate with Secrets Manager.  

Execute the following commands to create the Lambda function, VPC Endpoint and the API Gateway. CloudFormation will be used to create these resources. This script will create an S3 bucket to store the Lambda artifacts, and this bucket must be globally unique.  Modify the value of `BUCKETNAME` if you need to make it globally unique.

```
export BUCKETNAME=`echo "ngo-fabric-lambda-$(date +%N)" | tr '[:upper:]' '[:lower:]'`
export LAMBDANAME=`echo "$NETWORKNAME-fabric-lambda" | tr '[:upper:]' '[:lower:]'`
~/non-profit-blockchain/ngo-lambda/createLambda.sh
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
* [Part 7:](../ngo-events/README.md) Use blockchain events to notify users of NGO donations.
* [Part 8:](../blockchain-explorer/README.md) Deploy Hyperledger Explorer. 
* [Part 9:](../ngo-identity/README.md) Integrating blockchain users with Amazon Cognito.
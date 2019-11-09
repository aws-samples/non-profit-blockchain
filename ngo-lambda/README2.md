# Part 6: Read and write to the blockchain with AWS Lambda

Part 6 will show you how to publish a Lambda function that invokes chaincode on a Hyperledger Fabric blockchain network running on Amazon Managed Blockchain.  You will use the NodeJS Hyperledger Fabric SDK within the Lambda function to interface with the blockchain.

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
2. Create the Lambda function
3. Test the Lambda function

This architecture diagram illustrates how the Lambda function you will build and deploy fits within the overall architecture.

![Architecture Diagram](./Lambda%20Architecture%20Diagram.png)

## Step 1 - Create the Fabric user

Register and enroll an identity with the Fabric Certificate Authority (CA). You will use this identity within the Lambda function.  In the example below you are creating a user named `lambdaUser` with a password of `Welcome123`.  The password is optional and one will be generated if not provided.  The credentials will be written into `$CERTS_FOLDER/lambdaUser/keystore` and `$CERTS_FOLDER/lambdaUser/signcerts`.

Set environment variables for the username and password of the Fabric user you will be creating, as well as a folder for storing the credentials.

```
export FABRICUSER=lambdaUser
export FABRICUSERPASSWORD=Welcome123
```

Execute this script to register and enroll the Fabric user, and upload the credentials to AWS Secrets Manager.
```
~/non-profit-blockchain/ngo-lambda/createFabricUser.sh
```

## Step 2 - Create the Lambda function

Execute this script to create the Lambda function.

```
~/non-profit-blockchain/ngo-lambda/createLambda.sh
```

If you get an error indicating `Function already exists: ngo-lambda-function`, you can update the deployment bundle of the existing Lambda by executing this script:

```
~/non-profit-blockchain/ngo-lambda/updateLambda.sh
```

## Step 3 - Test the Lambda function

You can test the Lambda function from the [Lambda console](https://console.aws.amazon.com/lambda), or from the cli.

To test from the cli, you will execute the commands below.  The output of each command is in the file specified in the last argument, and is displayed via `cat`.

First, call the `createDonor` chaincode function to create the donor "melissa".
```
aws lambda invoke --function-name ngo-lambda-function --payload '{"fabricUsername":$FABRICUSER,"functionType": "invoke","chaincodeFunction": "createDonor","chaincodeFunctionArgs": {"donorUserName":"melissa","email":"melissa@melissasngo.org"}}' --region $REGION /tmp/lambda-output-createDonor.txt
cat /tmp/lambda-output-createDonor.txt
```

Next, call the `queryDonor` function to view the details of the donor we just created.
```
aws lambda invoke --function-name ngo-lambda-function --payload '{"fabricUsername":"$FABRICUSER","functionType":"queryObject","chaincodeFunction":"queryDonor","chaincodeFunctionArgs":{"donorUserName":"melissa"}}' --region $REGION /tmp/lambda-output-queryDonor.txt
cat /tmp/lambda-output-queryDonor.txt
```

Finally, call the `queryAllDonors` function to view all the donors.
```
aws lambda query --function-name ngo-lambda-function --payload '{"fabricUsername":"lambdaUser","functionType":"queryObject","chaincodeFunction":"queryAllDonors","chaincodeFunctionArgs":{}}' --region $REGION /tmp/lambda-output-queryAllDonors.txt
cat /tmp/lambda-output-queryAllDonors.txt
```

You now have a Lambda function that is querying the blockchain.  You can use this Lambda function to service API Gateway requests as part of a serverless architecture.

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../ngo-chaincode/README.md) Deploy the non-profit chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the RESTful API server. 
* [Part 4:](../ngo-ui/README.md) Run the application. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 
* [Part 6:](../ngo-lambda/README.md) Read and write to the blockchain with AWS Lambda.

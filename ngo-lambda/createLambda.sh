#!/bin/bash

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# or in the "license" file accompanying this file. This file is distributed
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
# express or implied. See the License for the specific language governing
# permissions and limitations under the License.

# This script registers and enrolls the user within the Fabric CA.  It then uploads the generated credentials to AWS Secrets Manager.

# Create the Lambda deployment bundle folder
export LAMBDA_DEPLOYMENT_FOLDER=/tmp/lambdaWork

# Copy the ngo-lambda folder from the repository
cp -rp ~/non-profit-blockchain/ngo-lambda $LAMBDA_DEPLOYMENT_FOLDER

# Copy the Managed Blockchain TLS Certificate
cp ~/managedblockchain-tls-chain.pem /tmp/lambdaWork/certs/managedblockchain-tls-chain.pem

# Generate and then copy the connection profile
cd $LAMBDA_DEPLOYMENT_FOLDER
./gen-connection-profile.sh
sed -i "s|/home/ec2-user/managedblockchain-tls-chain.pem|./certs/managedblockchain-tls-chain.pem|g" $LAMBDA_DEPLOYMENT_FOLDER/connection-profile.yaml

# Install the gcc compiler to be used when installing the npm dependencies
sudo yum install gcc-c++ -y

# Install Node.js. We will use v8.x.
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install lts/carbon
nvm use lts/carbon
npm install

# Create an IAM role for the Lambda function and grant it the necessary permissions to access our blockchain network and the Fabric credentials in Secrets Manager.
aws iam create-role --role-name Lambda-Fabric-Role --assume-role-policy-document file://Lambda-Fabric-Role-Trust-Policy.json > /tmp/lambdaFabricRole-output.json

# Add policies to the role that grant the Lambda execution and Secrets Manager policies.
aws iam attach-role-policy --role-name Lambda-Fabric-Role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
aws iam put-role-policy --role-name Lambda-Fabric-Role --policy-name SecretsManagerPolicy --policy-document file://Secrets-Manager-Policy.json

# Create the Lambda deployment bundle
cd $LAMBDA_DEPLOYMENT_FOLDER
zip -r /tmp/ngo-lambda-function.zip .

# You now have everything you need to create the Lambda function, including the IAM role with the required policies, and the code archive.  You will need to set a few input parameters to pass into the `create-function` call.  We will do this by setting environment variables for the role ARN from the output of step 7a, and the SubnetID and SecurityGroupID, which are retrieved from our CloudFormation stack outputs.

# Set these environment variables by issuing these commands. 

export ROLE_ARN=$(grep -o '"Arn": *"[^"]*"' /tmp/lambdaFabricRole-output.json | grep -o '"[^"]*"$' | tr -d '"')
export SUBNETID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text)
export SECURITYGROUPID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text)


# Create the function
aws lambda create-function --function-name ngo-lambda-function --runtime nodejs8.10 --handler index.handler --memory-size 512 --role $ROLE_ARN --vpc-config SubnetIds=$SUBNETID,SecurityGroupIds=$SECURITYGROUPID --environment Variables="{CA_ENDPOINT=$CASERVICEENDPOINT,PEER_ENDPOINT=grpcs://$PEERSERVICEENDPOINT,ORDERER_ENDPOINT=grpcs://$ORDERINGSERVICEENDPOINT,CHANNEL_NAME=$CHANNEL,CHAIN_CODE_ID=ngo,CRYPTO_FOLDER=/tmp,MSP=$MSP,FABRICUSER=$FABRICUSER,MEMBERNAME=$MEMBERNAME}" --zip-file fileb:///tmp/ngo-lambda-function.zip --region $REGION --timeout 30
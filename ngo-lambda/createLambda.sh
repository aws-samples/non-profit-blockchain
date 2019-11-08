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

cd ~/non-profit-blockchain/ngo-lambda

echo Copy the Managed Blockchain TLS Certificate
cp ~/managedblockchain-tls-chain.pem ./src/certs/managedblockchain-tls-chain.pem

echo Generate the Fabric connection profile
./gen-connection-profile.sh
sed -i "s|/home/ec2-user/managedblockchain-tls-chain.pem|./certs/managedblockchain-tls-chain.pem|g" ./src/connection-profile.yaml

# Install the gcc compiler to be used when installing the npm dependencies
sudo yum install gcc-c++ -y

echo Install Node.js. We will use v8.x.
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install lts/carbon
nvm use lts/carbon
cd src
npm install
cd ..

echo Package the Cloudformation template
export BUCKETNAME=`echo "$NETWORKNAME-fabric-lambda" | tr '[:upper:]' '[:lower:]'`
aws s3 mb s3://$BUCKETNAME --region $REGION

aws cloudformation package --template-file cloudformation-lambda.yaml \
    --output-template-file packaged-cloudformation-lambda.yaml \
    --s3-bucket $BUCKETNAME

echo Deploy the Lambda Cloudformation stack
export LAMBDA_STACK_NAME=fabric-lambda-stack
export VPC_STACK_NAME=$NETWORKNAME-fabric-client-node
export VPCID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='VPCID'].OutputValue" --output text --region $REGION)

aws cloudformation deploy --stack-name $LAMBDA_STACK_NAME --template-file packaged-cloudformation-lambda.yaml \
--region $REGION --capabilities CAPABILITY_NAMED_IAM \
--parameter-overrides CAENDPOINT=$CASERVICEENDPOINT PEERENDPOINT=grpcs://$PEERSERVICEENDPOINT \
ORDERERENDPOINT=grpcs://$ORDERINGSERVICEENDPOINT CHANNELNAME=$CHANNEL \
CHAINCODEID=$CHAINCODEID MSP=$MSP MEMBERNAME=$MEMBERNAME VPCID=$VPCID \
SECURITYGROUPID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text --region $REGION ) \
SUBNETID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text --region $REGION )

echo Lambda creation completed.
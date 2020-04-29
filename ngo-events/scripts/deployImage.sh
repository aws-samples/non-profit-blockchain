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

REGION=us-east-1
ROOT_FOLDER=~/non-profit-blockchain/ngo-events/
CHAINCODE=ngo
STACKNAME=event-listener-ecr-image
TEMPLATEFILE=$ROOT_FOLDER/templates/ecrImage.yaml
AWSACCOUNTID=$(aws sts get-caller-identity --output text --query 'Account')

echo Preparing the Docker image

echo Installing Node.js. We will use v10.x.
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install lts/dubnium
nvm use lts/dubnium
cd $ROOT_FOLDER/listener/src
npm install

echo Downloading Amazon Managed Blockchain public certificate
aws s3 cp s3://us-east-1.managedblockchain/etc/managedblockchain-tls-chain.pem $ROOT_FOLDER/listener/src/certs/managedblockchain-tls-chain.pem

echo Generate the Fabric connection profile
cd $ROOT_FOLDER/scripts
./gen-connection-profile.sh
sed -i "s|/home/ec2-user/managedblockchain-tls-chain.pem|/usr/src/app/certs/managedblockchain-tls-chain.pem|g" $ROOT_FOLDER/listener/src/connection-profile.yaml

echo Creating the ECR repository
aws cloudformation deploy --stack-name $STACKNAME --template-file $TEMPLATEFILE --region $REGION \
--parameter-overrides RepositoryName=$CHAINCODE/fabric-event-listener

echo Building the Docker image
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWSACCOUNTID.dkr.ecr.us-east-1.amazonaws.com
docker build -t $CHAINCODE/fabric-event-listener $ROOT_FOLDER/listener/src

echo Tagging the Docker image
docker tag $CHAINCODE/fabric-event-listener:latest $AWSACCOUNTID.dkr.ecr.us-east-1.amazonaws.com/$CHAINCODE/fabric-event-listener:latest

echo Uploading the Docker image
docker push $AWSACCOUNTID.dkr.ecr.us-east-1.amazonaws.com/$CHAINCODE/fabric-event-listener:latest
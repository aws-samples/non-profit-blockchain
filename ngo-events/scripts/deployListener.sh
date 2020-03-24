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

ROOT_FOLDER=~/non-profit-blockchain/ngo-events/
PHONENUMBER=+15555555555
CHAINCODE=ngo
STACKNAME=fabric-event-listener
TEMPLATEFILE=$ROOT_FOLDER/templates/eventListener.yaml
LISTENERUSER=eventListenerUser
PRIVATE_SUBNET_STACK_NAME=private-subnet
VPC_STACK_NAME=$NETWORKNAME-fabric-client-node
VPCID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='VPCID'].OutputValue" --output text --region $REGION)
LISTENERSERVICENAME=EventListenerService
AWSACCOUNTID=$(aws sts get-caller-identity --output text --query 'Account')

echo Preparing the Docker image

echo Installing Node.js. We will use v10.x.
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install lts/dubnium
nvm use lts/dubnium
cd $ROOT_FOLDER/listener/src
npm install

echo Generate the Fabric connection profile
cd $ROOT_FOLDER/scripts
./gen-connection-profile.sh
sed -i "s|/home/ec2-user/managedblockchain-tls-chain.pem|/usr/src/app/certs/managedblockchain-tls-chain.pem|g" $ROOT_FOLDER/listener/src/connection-profile.yaml

echo Creating the ECR repository
aws ecr create-repository --repository-name $CHAINCODE/fabric-event-listener

echo Building the Docker image
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWSACCOUNTID.dkr.ecr.us-east-1.amazonaws.com
docker build -t $CHAINCODE/fabric-event-listener $ROOT_FOLDER/listener/src

echo Tagging the Docker image
docker tag $CHAINCODE/fabric-event-listener:latest $AWSACCOUNTID.dkr.ecr.us-east-1.amazonaws.com/$CHAINCODE/fabric-event-listener:latest

echo Uploading the Docker image
docker push $AWSACCOUNTID.dkr.ecr.us-east-1.amazonaws.com/$CHAINCODE/fabric-event-listener:latest

echo Creating a private subnet
$ROOT_FOLDER/scripts/deployPrivateSubnet.sh

echo Deploying Cloudformation template to provision the Fargate cluster, SQS Queue
aws cloudformation deploy \
--stack-name $STACKNAME \
--capabilities "CAPABILITY_IAM" "CAPABILITY_NAMED_IAM" "CAPABILITY_AUTO_EXPAND" \
--template-file $TEMPLATEFILE \
--region $REGION \
--parameter-overrides ContainerImage=$AWSACCOUNTID.dkr.ecr.us-east-1.amazonaws.com/$CHAINCODE/fabric-event-listener:latest \
Chaincode=$CHAINCODE ChannelName=$CHANNEL FabricUser=$LISTENERUSER LogLevel=info MemberName=$MEMBERNAME \
MSP=$MEMBERID OrdererEndpoint=grpcs://$ORDERINGSERVICEENDPOINT PeerEndpoint=grpcs://$PEERSERVICEENDPOINT \
VpcId=$VPCID ServiceName=$LISTENERSERVICENAME PhoneNumber=$PHONENUMBER \
PrivateSecurityGroupId=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text --region $REGION ) \
PrivateSubnetId=$(aws cloudformation describe-stacks --stack-name $PRIVATE_SUBNET_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PrivateSubnetID'].OutputValue" --output text --region $REGION )
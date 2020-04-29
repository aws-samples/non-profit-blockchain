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
STACKNAME=fabric-event-listener
TEMPLATEFILE=$ROOT_FOLDER/templates/eventListener.yaml
LISTENERUSER=eventListenerUser
PRIVATE_SUBNET_STACK_NAME=private-subnet
VPC_STACK_NAME=$NETWORKNAME-fabric-client-node
VPCID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='VPCID'].OutputValue" --output text --region $REGION)
LISTENERSERVICENAME=EventListenerService
AWSACCOUNTID=$(aws sts get-caller-identity --output text --query 'Account')

echo Creating a private subnet
$ROOT_FOLDER/scripts/deployPrivateSubnet.sh

echo Deploying Cloudformation template to provision the Fargate cluster and SQS Queue
aws cloudformation deploy \
--stack-name $STACKNAME \
--capabilities "CAPABILITY_IAM" "CAPABILITY_NAMED_IAM" "CAPABILITY_AUTO_EXPAND" \
--template-file $TEMPLATEFILE \
--region $REGION \
--parameter-overrides ContainerImage=$AWSACCOUNTID.dkr.ecr.us-east-1.amazonaws.com/$CHAINCODE/fabric-event-listener:latest \
Chaincode=$CHAINCODE ChannelName=$CHANNEL FabricUser=$LISTENERUSER LogLevel=info MemberName=$MEMBERNAME \
MSP=$MEMBERID OrdererEndpoint=grpcs://$ORDERINGSERVICEENDPOINT PeerEndpoint=grpcs://$PEERSERVICEENDPOINT \
VpcId=$VPCID ServiceName=$LISTENERSERVICENAME \
PrivateSecurityGroupId=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text --region $REGION ) \
PrivateSubnetId=$(aws cloudformation describe-stacks --stack-name $PRIVATE_SUBNET_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PrivateSubnetID'].OutputValue" --output text --region $REGION )
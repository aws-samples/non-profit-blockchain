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
AZ=us-east-1d
STACKNAME=private-subnet
ROOT_FOLDER=~/non-profit-blockchain/ngo-events/
TEMPLATEFILE=$ROOT_FOLDER/templates/privateSubnet.yaml
VPC_STACK_NAME=$NETWORKNAME-fabric-client-node
VPCID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='VPCID'].OutputValue" --output text --region $REGION)
PUBLICSUBNETID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text --region $REGION )

echo Deploying Cloudformation template to provision the private subnet

aws cloudformation deploy \
--stack-name $STACKNAME \
--capabilities "CAPABILITY_IAM" "CAPABILITY_NAMED_IAM" "CAPABILITY_AUTO_EXPAND" \
--template-file $TEMPLATEFILE \
--region $REGION \
--parameter-overrides \
VPC=$VPCID \
PublicSubnetId=$PUBLICSUBNETID \
AvailabilityZone=$AZ
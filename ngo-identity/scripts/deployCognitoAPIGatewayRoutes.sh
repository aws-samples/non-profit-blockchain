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
PROJECT_ROOT_FOLDER=~/non-profit-blockchain/ngo-identity
CLOUDFORMATION_TEMPLATE=${PROJECT_ROOT_FOLDER}/templates/cognito-apigateway-routes-template.yaml

echo Deploying the Cloudformation stack
LAMBDANAME=ngo-fabric-lambda
CHAINCODEID=ngo
CHANNEL=mychannel
COGNITO_APIG_LAMBDA_STACK_NAME=cognito-apig-lambda-stack
VPC_STACK_NAME=$NETWORKNAME-fabric-client-node
API_NAME=identity-enabled-api

VPCID=$(aws cloudformation describe-stacks --stack-name "$VPC_STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='VPCID'].OutputValue" --output text --region "$REGION")

aws cloudformation deploy --stack-name "$COGNITO_APIG_LAMBDA_STACK_NAME" --template-file "$CLOUDFORMATION_TEMPLATE" \
--region "$REGION" --capabilities CAPABILITY_NAMED_IAM  \
--parameter-overrides NETWORKID="$NETWORKID" MEMBERID="$MEMBERID" LAMBDANAME="$LAMBDANAME" \
CHAINCODEID="$CHAINCODEID" MEMBERNAME="$MEMBERNAME" VPCID="$VPCID" CHANNELNAME="$CHANNEL" \
SECURITYGROUPID=$(aws cloudformation describe-stacks --stack-name "$VPC_STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output "text" --region "$REGION" ) \
SUBNETID=$(aws cloudformation describe-stacks --stack-name "$VPC_STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output "text" --region "$REGION" ) APINAME="$API_NAME"

echo Cognito and APIGateway routes successfully created.
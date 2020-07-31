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
LAMBDA_ROOT_FOLDER=${PROJECT_ROOT_FOLDER}/fabricLambda
CLOUDFORMATION_TEMPLATE=${PROJECT_ROOT_FOLDER}/templates/cognito-apig-lambda-template.yaml
CONNECTION_PROFILE_LOCAL_PATH=${PROJECT_ROOT_FOLDER}/templates/connection-profile.yaml
CONNECTION_PROFILE_PS_PATH=/amb/${NETWORKID}/${MEMBERID}/connection-profile



echo Downloading Amazon Managed Blockchain public certificate
aws s3 cp s3://us-east-1.managedblockchain/etc/managedblockchain-tls-chain.pem $LAMBDA_ROOT_FOLDER/src/certs/managedblockchain-tls-chain.pem

echo Generating the Fabric connection profile
./gen-connection-profile.sh
sed -i "s|/home/ec2-user/managedblockchain-tls-chain.pem|/usr/src/app/certs/managedblockchain-tls-chain.pem|g" $CONNECTION_PROFILE_LOCAL_PATH

echo Putting the connection profile on Parameter Store

aws ssm put-parameter \
    --name $CONNECTION_PROFILE_PS_PATH \
    --type "String" \
    --value "`cat $CONNECTION_PROFILE_LOCAL_PATH`" \
    --region $REGION \
    --overwrite

echo Installing the gcc compiler needed to install the npm dependencies
sudo yum install gcc-c++ -y

echo Installing Node.js v10
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install lts/dubnium
nvm use lts/dubnium

echo Installing Lambda npm modules
cd $LAMBDA_ROOT_FOLDER/src
npm install


BUCKETNAME=`echo "cf-templates-$(date +%N)-us-east-1" | tr '[:upper:]' '[:lower:]'`
echo Packaging the Cloudformation template to bucket $BUCKETNAME
aws s3 mb s3://$BUCKETNAME --region $REGION
aws cloudformation package --template-file $CLOUDFORMATION_TEMPLATE \
    --output-template-file packaged-cognito-apig-lambda-template.yaml \
    --s3-bucket $BUCKETNAME

echo Deploying the Cloudformation stack
LAMBDANAME=amb-fabric-lambda
CHAINCODEID=ngo
CHANNEL=mychannel
COGNITO_APIG_LAMBDA_STACK_NAME=cognito-apig-lambda-stack
PRIVATE_SUBNET_STACK_NAME=private-subnet
VPC_STACK_NAME=$NETWORKNAME-fabric-client-node
VPCID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='VPCID'].OutputValue" --output text --region $REGION)

aws cloudformation deploy --stack-name $COGNITO_APIG_LAMBDA_STACK_NAME --template-file packaged-cognito-apig-lambda-template.yaml \
--region $REGION --capabilities CAPABILITY_NAMED_IAM \
--parameter-overrides NETWORKID=$NETWORKID MEMBERID=$MEMBERID \
CHAINCODEID=$CHAINCODEID MEMBERNAME=$MEMBERNAME VPCID=$VPCID CHANNELNAME=$CHANNEL \
SECURITYGROUPID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text --region $REGION ) \
SUBNETID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text --region $REGION ) LAMBDANAME=$LAMBDANAME

echo Cognito, APIGateway, and Lambda successfully created.
echo API Gateway is active at:
echo $(aws cloudformation describe-stacks --stack-name $COGNITO_APIG_LAMBDA_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='DonorsAPIGatewayURL'].OutputValue" --output text --region $REGION )
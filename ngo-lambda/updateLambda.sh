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
cd $LAMBDA_DEPLOYMENT_FOLDER

export ROLE_ARN=$(grep -o '"Arn": *"[^"]*"' /tmp/lambdaFabricRole-output.json | grep -o '"[^"]*"$' | tr -d '"')
export SUBNETID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text)
export SECURITYGROUPID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text)

aws lambda update-function-configuration --function-name ngo-lambda-function --runtime nodejs8.10 --handler index.handler --memory-size 512 --role $ROLE_ARN --vpc-config SubnetIds=$SUBNETID,SecurityGroupIds=$SECURITYGROUPID --environment Variables="{CA_ENDPOINT=$CASERVICEENDPOINT,PEER_ENDPOINT=grpcs://$PEERSERVICEENDPOINT,ORDERER_ENDPOINT=grpcs://$ORDERINGSERVICEENDPOINT,CHANNEL_NAME=$CHANNEL,CHAIN_CODE_ID=ngo,CRYPTO_FOLDER=/tmp,MSP=$MSP,FABRICUSER=$FABRICUSER,MEMBERNAME=$MEMBERNAME}" --timeout 30

aws lambda update-function-code --function-name ngo-lambda-function --zip-file fileb:///tmp/ngo-lambda-function.zip --region $REGION

# Create the function
aws lambda create-function --function-name ngo-lambda-function --runtime nodejs8.10 --handler index.handler --memory-size 512 --role $ROLE_ARN --vpc-config SubnetIds=$SUBNETID,SecurityGroupIds=$SECURITYGROUPID --environment Variables="{CA_ENDPOINT=$CASERVICEENDPOINT,PEER_ENDPOINT=grpcs://$PEERSERVICEENDPOINT,ORDERER_ENDPOINT=grpcs://$ORDERINGSERVICEENDPOINT,CHANNEL_NAME=$CHANNEL,CHAIN_CODE_ID=ngo,CRYPTO_FOLDER=/tmp,MSP=$MSP,FABRICUSER=$FABRICUSER,MEMBERNAME=$MEMBERNAME}" --zip-file fileb:///tmp/ngo-lambda-function.zip --region $REGION --timeout 30
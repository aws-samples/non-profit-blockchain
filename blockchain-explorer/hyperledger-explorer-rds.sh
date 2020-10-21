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

echo Obtaining values from $NETWORKNAME-fabric-client-node cloudformation stack
BlockchainVPC=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query 'Stacks[0].Outputs[?OutputKey==`VPCID`].OutputValue' --output text)
BlockchainEC2=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query 'Stacks[0].Outputs[?OutputKey==`EC2ID`].OutputValue' --output text)
BlockchainSecurityGroup=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query 'Stacks[0].Outputs[?OutputKey==`SecurityGroupID`].OutputValue' --output text)
BlockchainPublicSubnet=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query 'Stacks[0].Outputs[?OutputKey==`PublicSubnetID`].OutputValue' --output text)

echo Creating Hyperledger Explorer Postgres RDS instance in VPC $BlockchainVPC. 
echo Allowing connection to RDS from Fabric Client node EC2 instance: $BlockchainEC2 in security group: $BlockchainSecurityGroup in subnet $BlockchainPublicSubnet
aws cloudformation deploy --stack-name $NETWORKNAME-hyperledger-explorer-rds --template-file hyperledger-explorer-cfn.yaml \
--capabilities CAPABILITY_NAMED_IAM \
--parameter-overrides BlockchainVPC=$BlockchainVPC BlockchainEC2=$BlockchainEC2 \
  BlockchainSecurityGroup=$BlockchainSecurityGroup BlockchainPublicSubnet=$BlockchainPublicSubnet \
--region $REGION

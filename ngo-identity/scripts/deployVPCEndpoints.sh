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
VPCE_SECRETS_MANAGER_CLOUDFORMATION_TEMPLATE=${PROJECT_ROOT_FOLDER}/templates/vpc-endpoint-secrets-manager-template.yaml
VPCE_SYSTEMS_MANAGER_CLOUDFORMATION_TEMPLATE=${PROJECT_ROOT_FOLDER}/templates/vpc-endpoint-systems-manager-template.yaml



VPC_STACK_NAME=$NETWORKNAME-fabric-client-node
VPCID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='VPCID'].OutputValue" --output text --region $REGION)
SECURITYGROUPID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text --region $REGION ) \
SUBNETID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text --region $REGION )

echo Checking existing VPC Endpoints to Secrets Manager...

VPCE_SECRETS_MANAGER=$(aws ec2 describe-vpc-endpoints --region $REGION --filters Name=service-name,Values=com.amazonaws.$REGION.secretsmanager --query 'VpcEndpoints' --output text)

if  [[ "$VPCE_SECRETS_MANAGER" == "" ]]; then
    echo Secrets Manager VPC Endpoint does not exist.  Creating...

    VPCE_SECRETS_MANAGER_STACK_NAME="vpc-endpoint-secrets-manager"
    
    aws cloudformation deploy --stack-name $VPCE_SECRETS_MANAGER_STACK_NAME --template-file $VPCE_SECRETS_MANAGER_CLOUDFORMATION_TEMPLATE \
    --region $REGION --parameter-overrides VPCID=$VPCID \
    SECURITYGROUPID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text --region $REGION ) \
    SUBNETID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text --region $REGION )

    echo Secrets Manager VPC Endpoint created
else
    echo Secrets Manager VPC Endpoint already exists.  Skipping creation.
fi

echo 
echo Checking existing VPC Endpoints to Systems Manager...

VPCE_SYSTEMS_MANAGER=$(aws ec2 describe-vpc-endpoints --region $REGION --filters Name=service-name,Values=com.amazonaws.$REGION.ssm --query 'VpcEndpoints' --output text)

if  [[ "$VPCE_SYSTEMS_MANAGER" == "" ]]; then
    
    echo Systems Manager VPC Endpoint does not exist.  Creating...
    
    VPCE_SYSTEMS_MANAGER_STACK_NAME="vpc-endpoint-systems-manager"
    
    aws cloudformation deploy --stack-name $VPCE_SYSTEMS_MANAGER_STACK_NAME --template-file $VPCE_SYSTEMS_MANAGER_CLOUDFORMATION_TEMPLATE \
    --region $REGION --parameter-overrides VPCID=$VPCID \
    SECURITYGROUPID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text --region $REGION ) \
    SUBNETID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text --region $REGION )

    echo Systems Manager VPC Endpoint created
else
    echo Systems Manager VPC Endpoint already exists.  Skipping creation.
fi
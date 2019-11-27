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

echo Creating VPC - TODO. Create the VPC, subnets, security group, EC2 client node, VPC endpoint
echo Create a keypair

STACKNAME=$(aws cloudformation describe-stacks --region $REGION --query 'Stacks[?Description==`Amazon Managed Blockchain. Creates network with a single member and peer node`] | [0].StackName' --output text)
NETWORKNAME=$(aws cloudformation describe-stacks --stack-name $STACKNAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`NetworkName`].OutputValue' --output text)
NETWORKID=$(aws cloudformation describe-stacks --stack-name $STACKNAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`NetworkId`].OutputValue' --output text)
VPCENDPOINTSERVICENAME=$(aws managedblockchain get-network --region $REGION --network-id $NETWORKID --query 'Network.VpcEndpointServiceName' --output text)

echo Searching for existing keypair named $NETWORKNAME-keypair
keyname=$(aws ec2 describe-key-pairs --key-names $NETWORKNAME-keypair --region $REGION --query 'KeyPairs[0].KeyName' --output text)
if  [[ "$keyname" == "$NETWORKNAME-keypair" ]]; then
    echo Keypair $NETWORKNAME-keypair already exists. Please choose another keypair name by editing this script
    exit 1
fi
 
echo Creating a keypair named $NETWORKNAME-keypair. The .pem file will be in your $HOME directory
aws ec2 create-key-pair --key-name $NETWORKNAME-keypair --region $REGION --query 'KeyMaterial' --output text > ~/$NETWORKNAME-keypair.pem
if [ $? -gt 0 ]; then
    echo Keypair $NETWORKNAME-keypair could not be created
    exit $?
fi

chmod 400 ~/$NETWORKNAME-keypair.pem
sleep 10

echo Create the VPC, the Fabric client node and the VPC endpoints
aws cloudformation deploy --stack-name $NETWORKNAME-fabric-client-node --template-file fabric-client-node.yaml \
--capabilities CAPABILITY_NAMED_IAM \
--parameter-overrides KeyName=$NETWORKNAME-keypair BlockchainVpcEndpointServiceName=$VPCENDPOINTSERVICENAME \
--region $REGION

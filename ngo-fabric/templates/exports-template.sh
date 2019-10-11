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

export REGION=us-east-1
export NETWORKNAME=$(aws cloudformation describe-stacks --stack-name non-profit-amb --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`NetworkName`].OutputValue' --output text)
export MEMBERNAME=$(aws cloudformation describe-stacks --stack-name non-profit-amb --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`MemberName`].OutputValue' --output text)
export NETWORKVERSION=$(aws cloudformation describe-stacks --stack-name non-profit-amb --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`FrameworkVersion`].OutputValue' --output text)
export ADMINUSER=$(aws cloudformation describe-stacks --stack-name non-profit-amb --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`MemberAdminUsername`].OutputValue' --output text)
export ADMINPWD=$(aws cloudformation describe-stacks --stack-name non-profit-amb --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`MemberAdminPassword`].OutputValue' --output text)
export NETWORKID=$(aws cloudformation describe-stacks --stack-name non-profit-amb --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`NetworkId`].OutputValue' --output text)
export MEMBERID=$(aws cloudformation describe-stacks --stack-name non-profit-amb --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`MemberId`].OutputValue' --output text)

# No need to change anything below here
echo Updating AWS CLI to the latest version
sudo pip install awscli --upgrade
cd ~

VpcEndpointServiceName=$(aws managedblockchain get-network --region $REGION --network-id $NETWORKID --query 'Network.VpcEndpointServiceName' --output text)
OrderingServiceEndpoint=$(aws managedblockchain get-network --region $REGION --network-id $NETWORKID --query 'Network.FrameworkAttributes.Fabric.OrderingServiceEndpoint' --output text)
CaEndpoint=$(aws managedblockchain get-member --region $REGION --network-id $NETWORKID --member-id $MEMBERID --query 'Member.FrameworkAttributes.Fabric.CaEndpoint' --output text)
nodeID=$(aws managedblockchain list-nodes --region $REGION --network-id $NETWORKID --member-id $MEMBERID --query 'Nodes[0].Id' --output text)
peerEndpoint=$(aws managedblockchain get-node --region $REGION --network-id $NETWORKID --member-id $MEMBERID --node-id $nodeID --query 'Node.FrameworkAttributes.Fabric.PeerEndpoint' --output text)
peerEventEndpoint=$(aws managedblockchain get-node --region $REGION --network-id $NETWORKID --member-id $MEMBERID --node-id $nodeID --query 'Node.FrameworkAttributes.Fabric.PeerEventEndpoint' --output text)
export ORDERINGSERVICEENDPOINT=$OrderingServiceEndpoint
export ORDERINGSERVICEENDPOINTNOPORT=${ORDERINGSERVICEENDPOINT::-6}
export VPCENDPOINTSERVICENAME=$VpcEndpointServiceName
export CASERVICEENDPOINT=$CaEndpoint
export PEERNODEID=$nodeID
export PEERSERVICEENDPOINT=$peerEndpoint
export PEERSERVICEENDPOINTNOPORT=${PEERSERVICEENDPOINT::-6}
export PEEREVENTENDPOINT=$peerEventEndpoint

echo Useful information used in Cloud9
echo REGION: $REGION
echo NETWORKNAME: $NETWORKNAME
echo NETWORKVERSION: $NETWORKVERSION
echo ADMINUSER: $ADMINUSER
echo ADMINPWD: $ADMINPWD
echo MEMBERNAME: $MEMBERNAME
echo NETWORKID: $NETWORKID
echo MEMBERID: $MEMBERID
echo ORDERINGSERVICEENDPOINT: $ORDERINGSERVICEENDPOINT
echo ORDERINGSERVICEENDPOINTNOPORT: $ORDERINGSERVICEENDPOINTNOPORT
echo VPCENDPOINTSERVICENAME: $VPCENDPOINTSERVICENAME
echo CASERVICEENDPOINT: $CASERVICEENDPOINT
echo PEERNODEID: $PEERNODEID
echo PEERSERVICEENDPOINT: $PEERSERVICEENDPOINT
echo PEERSERVICEENDPOINTNOPORT: $PEERSERVICEENDPOINTNOPORT
echo PEEREVENTENDPOINT: $PEEREVENTENDPOINT

# Exports to be exported before executing any Fabric 'peer' commands via the CLI
cat << EOF > peer-exports.sh
export MSP_PATH=/opt/home/admin-msp
export MSP=$MEMBERID
export ORDERER=$ORDERINGSERVICEENDPOINT
export PEER=$PEERSERVICEENDPOINT
export CHANNEL=mychannel
export CAFILE=/opt/home/managedblockchain-tls-chain.pem
export CHAINCODENAME=mycc
export CHAINCODEVERSION=v0
export CHAINCODEDIR=github.com/chaincode_example02/go
EOF

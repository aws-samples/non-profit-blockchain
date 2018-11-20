#!/usr/bin/env bash

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# Update these values, then `source` this script
export REGION=us-east-1
export NETWORKNAME=<your network name>
export MEMBERNAME=<the member name you entered when creating your Fabric network>
export NETWORKVERSION=1.2
export ADMINUSER=<the admin user name you entered when creating your Fabric network>
export ADMINPWD=<the admin user name you entered when creating your Fabric network>
export NETWORKID=<your network ID, from the AWS Console>
export MEMBERID=<your member ID, from the AWS Console>

echo Downloading and installing model file for new service
cd ~
aws s3 cp s3://taiga-beta-test/service-2.json .  
aws configure add-model --service-model file://service-2.json --service-name managedblockchain

export ENDPOINT=https://taiga-beta.us-east-1.amazonaws.com

# No need to change anything below here
VpcEndpointServiceName=$(aws managedblockchain get-network --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --query 'Network.VpcEndpointServiceName' --output text)
OrderingServiceEndpoint=$(aws managedblockchain get-network --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --query 'Network.FrameworkAttributes.Fabric.OrderingServiceEndpoint' --output text)
CaEndpoint=$(aws managedblockchain get-member --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --member-id $MEMBERID --query 'Member.FrameworkAttributes.Fabric.CaEndpoint' --output text)
nodeID=$(aws managedblockchain list-nodes --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --member-id $MEMBERID --query 'Nodes[0].Id' --output text)
endpoint=$(aws managedblockchain get-node --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --member-id $MEMBERID --node-id $nodeID --query 'Node.Endpoint' --output text)

export ORDERINGSERVICEENDPOINT=$OrderingServiceEndpoint
export VPCENDPOINTSERVICENAME=$VpcEndpointServiceName
export CASERVICEENDPOINT=$CaEndpoint
export PEERNODEID=$nodeID
export PEERSERVICEENDPOINT=$endpoint

echo Useful information used in Cloud9
echo REGION: $REGION
echo ENDPOINT: $ENDPOINT
echo NETWORKNAME: $NETWORKNAME
echo NETWORKVERSION: $NETWORKVERSION
echo ADMINUSER: $ADMINUSER
echo ADMINPWD: $ADMINPWD
echo MEMBERNAME: $MEMBERNAME
echo NETWORKID: $NETWORKID
echo MEMBERID: $MEMBERID
echo ORDERINGSERVICEENDPOINT: $ORDERINGSERVICEENDPOINT
echo VPCENDPOINTSERVICENAME: $VPCENDPOINTSERVICENAME
echo CASERVICEENDPOINT: $CASERVICEENDPOINT
echo PEERNODEID: $PEERNODEID
echo PEERSERVICEENDPOINT: $PEERSERVICEENDPOINT

echo Exports to be used on client node
echo After step 4, create a file on the client node to contain these exports
echo Export these values before running any Fabric commands on the client node
echo export MSP_PATH=/opt/home/admin-msp
echo export MSP=$MEMBERID
echo export ORDERER=$ORDERINGSERVICEENDPOINT
echo export PEER=$PEERSERVICEENDPOINT
echo export CHANNEL=mychannel
echo export CAFILE=/opt/home/taiga-tls.pem
echo export CHAINCODENAME=mycc
echo export CHAINCODEVERSION=v0
echo export CHAINCODEDIR=github.com/chaincode_example02/go
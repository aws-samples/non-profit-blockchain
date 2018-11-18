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

export REGION=us-east-1
export ENDPOINT=https://taiga-beta.us-east-1.amazonaws.com
export NETWORKNAME=ngo
export NETWORKVERSION=1.2
export ADMINUSER=admin
export ADMINPWD=adminpwd
export ORGNAME=org1

# If you need to re-export after creating the Fabric network, you'll need to update the Fabric network ID below
export NETWORKID=hnyvgusrnnh7lcgcn5whj7buju
export NETWORKMEMBERID=3wtoplvu35hv7oeuwvbbcb5gjm

VpcEndpointServiceName=$(aws taiga get-network --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --query 'Network.VpcEndpointServiceName' --output text)
OrderingServiceEndpoint=$(aws taiga get-network --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --query 'Network.FrameworkAttributes.Fabric.OrderingServiceEndpoint' --output text)
CaEndpoint=$(aws taiga get-network-member --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --network-member-id $NETWORKMEMBERID --query 'NetworkMember.FrameworkAttributes.Fabric.CaEndpoint' --output text)
nodeID=$(aws taiga list-nodes --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --network-member-id $NETWORKID --query 'Nodes[0].Id' --output text)
ndpoint=$(aws taiga get-node --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --network-member-id $NETWORKID --node-id $nodeID --query 'Node.Endpoint' --output text)

# Export these values
export ORDERINGSERVICEENDPOINT=$OrderingServiceEndpoint
export VPCENDPOINTSERVICENAME=$VpcEndpointServiceName
export CASERVICEENDPOINT=$CaEndpoint
export PEERNODEID=$nodeID
export PEERSERVICEENDPOINT=$endpoint

echo Useful information
echo REGION: $REGION
echo ENDPOINT: $ENDPOINT
echo NETWORKNAME: $NETWORKNAME
echo NETWORKVERSION: $NETWORKVERSION
echo ADMINUSER: $ADMINUSER
echo ADMINPWD: $ADMINPWD
echo ORGNAME: $ORGNAME
echo NETWORKID: $NETWORKID
echo NETWORKMEMBERID: $NETWORKMEMBERID
echo ORDERINGSERVICEENDPOINT: $ORDERINGSERVICEENDPOINT
echo VPCENDPOINTSERVICENAME: $VPCENDPOINTSERVICENAME
echo CASERVICEENDPOINT: $CASERVICEENDPOINT
echo PEERNODEID: $PEERNODEID
echo PEERSERVICEENDPOINT: $PEERSERVICEENDPOINT

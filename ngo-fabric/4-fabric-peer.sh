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

echo Create the Fabric Peer node
token=$(uuidgen)
echo Creating Fabric peer for network $networkname
result=$(aws taiga create-node --endpoint-url $ENDPOINT --region $REGION \
        --client-request-token $token \
        --node-configuration '{"InstanceType":"bc.t3.small","AvailabilityZone":"us-east-1a"}' \
        --network-id $NETWORKID \
        --network-member-id $NETWORKMEMBERID)
  
nodeID=$(jq -r '.NodeId' <<< $result)
echo Peer Node ID: $nodeID

echo Waiting for peer node to become HEALTHY
while (true); do
    STATUS=$(aws taiga get-node --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --network-member-id $NETWORKID --node-id $nodeID --query 'Node.Status' --output text)
    if  [[ "$STATUS" == "HEALTHY" ]]; then
        echo Status of Fabric node $nodeID is $STATUS
        break
    else
        echo Status of Fabric node $nodeID is $STATUS. Sleeping for 30s
        sleep 30s
    fi
done

AvailabilityZone=$(aws taiga get-node --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --network-member-id $NETWORKID --node-id $nodeID --query 'Node.AvailabilityZone' --output text)
endpoint=$(aws taiga get-node --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --network-member-id $NETWORKID --node-id $nodeID --query 'Node.Endpoint' --output text)
echo Useful information
echo
echo Node ID: $nodeID
echo Peer Service Endpoint: $endpoint
\
# Export these values
export PEERNODEID=$nodeID
export PEERSERVICEENDPOINT=$endpoint
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

echo Check that the VPC endpoint has been created and is available
while (true); do
    VpcEndpointServiceName=$(aws managedblockchain get-network --endpoint-url $ENDPOINT --region $REGION --network-id $NETWORKID --query 'Network.VpcEndpointServiceName' --output text)
    if  [[ "$VpcEndpointServiceName" == "" ]]; then
        echo VPC endpoint has not yet been created. Sleeping for 30s
        sleep 30
    fi
done

echo VPC endpoint has been created. Now check that the VPC endpoint is available
while (true); do
    status=$(aws ec2 describe-vpc-endpoints --filters Name=service-name,Values=$VpcEndpointServiceName --region $REGION --query 'VpcEndpoints[0].State' --output text)                         
    if  [[ "$status" == "available" ]]; then
        echo VPC endpoint $VpcEndpointServiceName is available 
    else
        echo VPC endpoint $VpcEndpointServiceName is NOT available. Sleeping for 30s
        sleep 30 
    fi
done
 

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

echo Creating VPC - TODO. Create the VPC, subnets, security group, EC2 client node, VPC endpoint
echo Create a keypair

keyname=$(aws ec2 describe-key-pairs --key-names $NETWORKNAME-keypair --region $REGION --query 'KeyPairs[0].KeyName' --output text)
echo Searching for existing keypair. Found $keyname
if  [[ "$keyname" == "$NETWORKNAME-keypair" ]]; then
    echo Keypair $NETWORKNAME-keypair already exists. Please choose another keypair name by editing this script
    exit 1
fi
 
aws ec2 create-key-pair --key-name $NETWORKNAME-keypair --region $REGION --query 'KeyMaterial' --output text > ~/$NETWORKNAME-keypair.pem
if [ $? -neq 0 ]
    echo Keypair $NETWORKNAME-keypair could not be created
    exit $?
fi

chmod 400 $NETWORKNAME-keypair.pem
sleep 10

echo Create the VPC, the Fabric client node and the VPC endpoints
aws cloudformation deploy --stack-name fabric-client-node --template-file fabric-client-node.yaml \
--capabilities CAPABILITY_NAMED_IAM \
--parameter-overrides KeyName=$NETWORKNAME-keypair BlockchainVpcEndpointServiceName=$VPCENDPOINTSERVICENAME \
--region $REGION

aws cloudformation wait stack-create-complete --stack-name fabric-client-node


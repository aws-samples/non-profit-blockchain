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

# Before executing this command, we will need to set the VPC ID in an environment variable.
export VPCID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='VPCID'].OutputValue" --output text)
export SUBNETID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text)
export SECURITYGROUPID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text)

aws ec2 create-vpc-endpoint --vpc-id $VPCID --vpc-endpoint-type Interface --subnet-ids $SUBNETID --service-name com.amazonaws.us-east-1.secretsmanager --security-group-id $SECURITYGROUPID --region $REGION

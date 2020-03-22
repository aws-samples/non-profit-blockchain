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

PHONENUMBER=+15555555555
LISTENER_STACKNAME=fabric-event-listener
STACKNAME=fabric-event-handler
TEMPLATEFILE=../templates/eventHandler.yaml
SQS_QUEUE_ARN=$(aws cloudformation describe-stacks --stack-name $LISTENER_STACKNAME --query "Stacks[0].Outputs[?OutputKey=='SQS_QUEUE_ARN'].OutputValue" --output text --region $REGION)

echo Deploying Cloudformation template to provision the Lambda function and SNS subscription
aws cloudformation deploy \
--stack-name $STACKNAME \
--capabilities "CAPABILITY_IAM" "CAPABILITY_NAMED_IAM" "CAPABILITY_AUTO_EXPAND" \
--template-file $TEMPLATEFILE \
--region $REGION \
--parameter-overrides SQSQueueArn=$SQS_QUEUE_ARN PhoneNumber=$PHONENUMBER
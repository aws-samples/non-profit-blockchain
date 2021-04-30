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

# Cognito Pool info
REGION=us-east-1
COGNITO_APIG_LAMBDA_STACK_NAME=cognito-apig-lambda-stack
COGNITO_USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $COGNITO_APIG_LAMBDA_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolID'].OutputValue" --output text --region $REGION )
echo Cognito pool id is "$COGNITO_USER_POOL_ID"

# User data
TEMP_PASSWORD=ChangeMe123!
CUSTOM_ATT_FABRIC_USER=custom:fabricUsername

# Donor user
DONOR_USERNAME=bobdonor
DONOR_PASSWORD=Welcome123!
DONOR_FABRIC_USERNAME=ngoDonor

MANAGER_USERNAME=alicemanager
MANAGER_PASSWORD=Welcome123!
MANAGER_FABRIC_USERNAME=ngoManager

# Create users, set Fabric username attribute, and set password
# Donor user
echo Creating donor user
aws cognito-idp admin-create-user --user-pool-id "$COGNITO_USER_POOL_ID" --username "$DONOR_USERNAME" --temporary-password "$TEMP_PASSWORD" --region "$REGION"
aws cognito-idp admin-update-user-attributes --user-pool-id "$COGNITO_USER_POOL_ID" --username "$DONOR_USERNAME" --user-attributes Name=$CUSTOM_ATT_FABRIC_USER,Value=$DONOR_FABRIC_USERNAME --region "$REGION"
aws cognito-idp admin-set-user-password --user-pool-id "$COGNITO_USER_POOL_ID" --username "$DONOR_USERNAME" --password "$DONOR_PASSWORD" --permanent --region "$REGION"
echo Donor user successfully created
echo

# Manager user
echo Creating manager user
aws cognito-idp admin-create-user --user-pool-id "$COGNITO_USER_POOL_ID" --username "$MANAGER_USERNAME" --temporary-password "$TEMP_PASSWORD" --region "$REGION"
aws cognito-idp admin-update-user-attributes --user-pool-id "$COGNITO_USER_POOL_ID" --username "$MANAGER_USERNAME" --user-attributes Name=$CUSTOM_ATT_FABRIC_USER,Value=$MANAGER_FABRIC_USERNAME --region "$REGION"
aws cognito-idp admin-set-user-password --user-pool-id "$COGNITO_USER_POOL_ID" --username "$MANAGER_USERNAME" --password "$MANAGER_PASSWORD" --permanent --region "$REGION"
echo Manager user successfully created

# Helper to retrieve newly created users
# aws cognito-idp admin-get-user --user-pool-id $COGNITO_USER_POOL_ID --username $DONOR_USERNAME --region $REGION


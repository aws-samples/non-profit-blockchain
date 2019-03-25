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

set +e

region=us-east-1
memberID=<your member ID, from the AWS Console>

# convert memberID to lowercase. S3 buckets must be lower case
memberID=$(echo "$memberID" | tr '[:upper:]' '[:lower:]')
S3BucketNameCreator=${memberID}-creator
S3BucketNameNewMember=${memberID}-newmember

# copy the certificates for the new Fabric member to S3
function copyCertsToS3 {
    echo "Copying the certs for the new org to S3"
    if [[ $(aws configure list) && $? -eq 0 ]]; then
        aws s3api put-object --bucket $S3BucketNameNewMember --key ${memberID}/admincerts --body /home/ec2-user/admin-msp/admincerts/cert.pem
        aws s3api put-object --bucket $S3BucketNameNewMember --key ${memberID}/cacerts --body /home/ec2-user/admin-msp/cacerts/*.pem
        aws s3api put-object-acl --bucket $S3BucketNameNewMember --key ${memberID}/admincerts --acl public-read
        aws s3api put-object-acl --bucket $S3BucketNameNewMember --key ${memberID}/cacerts --acl public-read
    else
        echo "AWS CLI is not configured on this node. To run this script install and configure the AWS CLI"
    fi
    echo "Copying the certs for the new org to S3 complete"
}

# copy the certificates for the new Fabric member from S3 to the Fabric creator network
function copyCertsFromS3 {
    echo "Copying the certs from S3"
    if [[ $(aws configure list) && $? -eq 0 ]]; then
        mkdir -p /home/ec2-user/${memberID}-msp/admincerts
        mkdir -p /home/ec2-user/${memberID}-msp/cacerts
        aws s3api get-object --bucket $S3BucketNameNewMember --key ${memberID}/admincerts /home/ec2-user/${memberID}-msp/admincerts/cert.pem
        aws s3api get-object --bucket $S3BucketNameNewMember --key ${memberID}/cacerts /home/ec2-user/${memberID}-msp/cacerts/cacert.pem
        ls -lR /home/ec2-user/${memberID}-msp/
    else
        echo "AWS CLI is not configured on this node. To run this script install and configure the AWS CLI"
    fi
    echo "Copying the certs from S3 complete"
}

# copy the Channel Genesis block from the Fabric creator network to S3
function copyChannelGenesisToS3 {
    echo "Copying the Channel Genesis block to S3"
    if [[ $(aws configure list) && $? -eq 0 ]]; then
        aws s3api put-object --bucket $S3BucketNameCreator --key org0/mychannel.block --body /home/ec2-user/fabric-samples/chaincode/hyperledger/fabric/peer/mychannel.block
        aws s3api put-object-acl --bucket $S3BucketNameCreator --key org0/mychannel.block --grant-read uri=http://acs.amazonaws.com/groups/global/AllUsers
        aws s3api put-object-acl --bucket $S3BucketNameCreator --key org0/mychannel.block --acl public-read
    else
        echo "AWS CLI is not configured on this node. To run this script install and configure the AWS CLI"
    fi
    echo "Copying the Channel Genesis block to S3 complete"
}

# copy the Channel Genesis block from S3 to the new Fabric member
function copyChannelGenesisFromS3 {
    echo "Copying the Channel Genesis block from S3"
    if [[ $(aws configure list) && $? -eq 0 ]]; then
        sudo chown -R ec2-user /home/ec2-user/fabric-samples/chaincode/hyperledger/fabric/peer
        aws s3api get-object --bucket $S3BucketNameCreator --key org0/mychannel.block /home/ec2-user/fabric-samples/chaincode/hyperledger/fabric/peer/mychannel.block
    else
        echo "AWS CLI is not configured on this node. To run this script install and configure the AWS CLI"
    fi
    echo "Copying the Channel Genesis block from S3 complete"
}

# create S3 bucket to copy files from the Fabric network creator. Bucket will be read-only to other members
function createS3BucketForCreator {
    #create the s3 bucket
    echo -e "creating s3 bucket for network creator: $S3BucketNameCreator"
    #quick way of determining whether the AWS CLI is installed and a default profile exists
    if [[ $(aws configure list) && $? -eq 0 ]]; then
        if [[ "$region" == "us-east-1" ]]; then
            aws s3api create-bucket --bucket $S3BucketNameCreator --region $region
        else
            aws s3api create-bucket --bucket $S3BucketNameCreator --region $region --create-bucket-configuration LocationConstraint=$region
        fi
        aws s3api put-bucket-acl --bucket $S3BucketNameCreator --grant-read uri=http://acs.amazonaws.com/groups/global/AllUsers
        aws s3api put-bucket-acl --bucket $S3BucketNameCreator --acl public-read
    else
        echo "AWS CLI is not configured on this node. To run this script install and configure the AWS CLI"
    fi
    echo "Creating the S3 bucket complete"
}

# create S3 bucket to copy files from the new member. Bucket will be read-only to other members
function createS3BucketForNewMember {
    #create the s3 bucket
    echo -e "creating s3 bucket for new member $NEW_ORG: $S3BucketNameNewMember"
    #quick way of determining whether the AWS CLI is installed and a default profile exists
    if [[ $(aws configure list) && $? -eq 0 ]]; then
        if [[ "$region" == "us-east-1" ]]; then
            aws s3api create-bucket --bucket $S3BucketNameNewMember --region $region
        else
            aws s3api create-bucket --bucket $S3BucketNameNewMember --region $region --create-bucket-configuration LocationConstraint=$region
        fi
        aws s3api put-bucket-acl --bucket $S3BucketNameNewMember --grant-read uri=http://acs.amazonaws.com/groups/global/AllUsers
        aws s3api put-bucket-acl --bucket $S3BucketNameNewMember --acl public-read
    else
        echo "AWS CLI is not configured on this node. To run this script install and configure the AWS CLI"
    fi
    echo "Creating the S3 bucket complete"
}

# This is a little hack I found here: https://stackoverflow.com/questions/8818119/how-can-i-run-a-function-from-a-script-in-command-line
# that allows me to call this bash script and invoke a specific function from the command line
"$@"


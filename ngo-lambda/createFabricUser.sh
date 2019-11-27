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
export CERTS_FOLDER=/tmp/certs
export PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin

# Register and enroll
fabric-ca-client register --id.name $FABRICUSER --id.affiliation $MEMBERNAME --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem --id.type user --id.secret $FABRICUSERPASSWORD
fabric-ca-client enroll -u https://$FABRICUSER:$FABRICUSERPASSWORD@$CASERVICEENDPOINT --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M $CERTS_FOLDER/$FABRICUSER

# Put the credentials on Secrets Manager
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRICUSER/pk" --secret-string "`cat $CERTS_FOLDER/$FABRICUSER/keystore/*`" --region $REGION
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRICUSER/signcert" --secret-string "`cat $CERTS_FOLDER/$FABRICUSER/signcerts/*`" --region $REGION
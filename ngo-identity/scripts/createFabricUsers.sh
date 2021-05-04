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
CERTS_FOLDER=/tmp/certs
PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin

# NGO Donor user variables
FABRIC_USERNAME_NGO_DONOR=ngoDonor

# NGO Manager user variables
FABRIC_USERNAME_NGO_MANAGER=ngoManager

# Users' password
FABRICUSERPASSWORD=changeme

# Register and enroll NGO Donor
echo Registering user 'ngoDonor'
fabric-ca-client register --id.name "$FABRIC_USERNAME_NGO_DONOR" --id.affiliation "$MEMBERNAME" --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem --id.type user --id.secret "$FABRICUSERPASSWORD" --id.attrs "fullname='Bob D Donor':ecert,role=ngo_donor:ecert"

echo Enrolling user 'ngoDonor'
fabric-ca-client enroll -u https://"$FABRIC_USERNAME_NGO_DONOR":"$FABRICUSERPASSWORD"@"$CASERVICEENDPOINT" --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M "$CERTS_FOLDER"/"$FABRIC_USERNAME_NGO_DONOR" --enrollment.attrs "role,fullname,hf.EnrollmentID,hf.Affiliation"

# Put the credentials on Secrets Manager
echo Putting user 'ngoDonor' private key and certificate on Secrets Manager
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRIC_USERNAME_NGO_DONOR/pk" --secret-string "$(cat "$CERTS_FOLDER"/"$FABRIC_USERNAME_NGO_DONOR"/keystore/*)" --region "$REGION"
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRIC_USERNAME_NGO_DONOR/signcert" --secret-string "$(cat "$CERTS_FOLDER"/"$FABRIC_USERNAME_NGO_DONOR"/signcerts/*)" --region "$REGION"

# Register and enroll NGO Manager
echo Registering user 'ngoManager'
fabric-ca-client register --id.name "$FABRIC_USERNAME_NGO_MANAGER" --id.affiliation "$MEMBERNAME" --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem --id.type user --id.secret "$FABRICUSERPASSWORD" --id.attrs "fullname='Alice Manager':ecert,role=ngo_manager:ecert"

echo Enrolling user 'ngoManager'
fabric-ca-client enroll -u https://"$FABRIC_USERNAME_NGO_MANAGER":"$FABRICUSERPASSWORD"@"$CASERVICEENDPOINT" --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M "$CERTS_FOLDER"/"$FABRIC_USERNAME_NGO_MANAGER" --enrollment.attrs "role,fullname,hf.EnrollmentID,hf.Affiliation"

# Put the credentials on Secrets Manager
echo Putting user 'ngoManager' private key and certificate on Secrets Manager
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRIC_USERNAME_NGO_MANAGER/pk" --secret-string "$(cat "$CERTS_FOLDER"/"$FABRIC_USERNAME_NGO_MANAGER"/keystore/*)" --region "$REGION"
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRIC_USERNAME_NGO_MANAGER/signcert" --secret-string "$(cat "$CERTS_FOLDER"/"$FABRIC_USERNAME_NGO_MANAGER"/signcerts/*)" --region "$REGION"
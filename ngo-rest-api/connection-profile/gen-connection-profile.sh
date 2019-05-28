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

# REPODIR points to this repo
# LOCALCA points to the location of the TLS cert
REPODIR=~/non-profit-blockchain
LOCALCA=/home/ec2-user/managedblockchain-tls-chain.pem 

#copy the connection profiles
mkdir -p $REPODIR/tmp/connection-profile/org1
cp $REPODIR/ngo-rest-api/connection-profile/ngo-connection-profile-template.yaml $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
cp $REPODIR/ngo-rest-api/connection-profile/client-org1.yaml $REPODIR/tmp/connection-profile/org1

#update the connection profiles with endpoints and other information
sed -i "s|%PEERNODEID%|$PEERNODEID|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%MEMBERID%|$MEMBERID|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%CAFILE%|$LOCALCA|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%ORDERINGSERVICEENDPOINT%|$ORDERINGSERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%ORDERINGSERVICEENDPOINTNOPORT%|$ORDERINGSERVICEENDPOINTNOPORT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%PEERSERVICEENDPOINT%|$PEERSERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%PEERSERVICEENDPOINTNOPORT%|$PEERSERVICEENDPOINTNOPORT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%PEEREVENTENDPOINT%|$PEEREVENTENDPOINT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%CASERVICEENDPOINT%|$CASERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%ADMINUSER%|$ADMINUSER|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%ADMINPWD%|$ADMINPWD|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml

ls -lR $REPODIR/tmp/connection-profile
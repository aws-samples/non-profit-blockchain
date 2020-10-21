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
MSPDIR=/home/ec2-user/admin-msp 
EXPLORERCONFIG=~/blockchain-explorer/app/platform/fabric/config.json
EXPLORERPROFILE=~/blockchain-explorer/app/platform/fabric/amb-network.json

#copy the connection profiles
cp $REPODIR/blockchain-explorer/connection-profile/config.json $EXPLORERCONFIG
cp $REPODIR/blockchain-explorer/connection-profile/explorer-connection-profile-template.json $EXPLORERPROFILE

#update the connection profiles with endpoints and other information
sed -i "s|%PEERNODEID%|$PEERNODEID|g" $EXPLORERPROFILE
sed -i "s|%MEMBERID%|$MEMBERID|g" $EXPLORERPROFILE
sed -i "s|%CAFILE%|$LOCALCA|g" $EXPLORERPROFILE
sed -i "s|%ORDERINGSERVICEENDPOINT%|$ORDERINGSERVICEENDPOINT|g" $EXPLORERPROFILE
sed -i "s|%ORDERINGSERVICEENDPOINTNOPORT%|$ORDERINGSERVICEENDPOINTNOPORT|g" $EXPLORERPROFILE
sed -i "s|%PEERSERVICEENDPOINT%|$PEERSERVICEENDPOINT|g" $EXPLORERPROFILE
sed -i "s|%PEERSERVICEENDPOINTNOPORT%|$PEERSERVICEENDPOINTNOPORT|g" $EXPLORERPROFILE
sed -i "s|%PEEREVENTENDPOINT%|$PEEREVENTENDPOINT|g" $EXPLORERPROFILE
sed -i "s|%CASERVICEENDPOINT%|$CASERVICEENDPOINT|g" $EXPLORERPROFILE
sed -i "s|%ADMINUSER%|$ADMINUSER|g" $EXPLORERPROFILE
sed -i "s|%ADMINPWD%|$ADMINPWD|g" $EXPLORERPROFILE

#get the key files
files=( $MSPDIR/keystore/* )
echo "${files[0]}"
sed -i "s|%KEYSTOREFILENAME%|${files[0]}|g" $EXPLORERPROFILE

files=( $MSPDIR/signcerts/* )
echo "${files[0]}"
sed -i "s|%SIGNEDCERTSFILENAME%|${files[0]}|g" $EXPLORERPROFILE

ls -lR $EXPLORERPROFILE
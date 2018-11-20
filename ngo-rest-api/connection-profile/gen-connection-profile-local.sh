#!/bin/bash

#
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
#

# This script uses the template ngo-connection-profile.json to generate a connection profile
# for the organisations in the Fabric network.

#REPODIR points to this repo.
REPODIR=~/Documents/apps/non-profit-blockchain

#CERTDIR points to the location of the fabric-samples repo. If you are using this to run Fabric, the crypto information
#would have been generated in the first-network/crypto-config folder.
CERTDIR=~/Documents/apps/fabric-samples

#copy the connection profiles
mkdir -p $REPODIR/tmp/connection-profile/org1
mkdir -p $REPODIR/tmp/connection-profile/org2
cp ngo-connection-profile.yaml $REPODIR/tmp/connection-profile
cp client-org1.yaml $REPODIR/tmp/connection-profile/org1
cp client-org2.yaml $REPODIR/tmp/connection-profile/org2

#update the connection profiles to refer to the location of the Fabric crypto information
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -e "s|%REPODIR%|$CERTDIR|g" ngo-connection-profile.yaml > $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
else
    sed -i "s|%REPODIR%|$CERTDIR|g"  $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
fi 

ls -lR $REPODIR/tmp/connection-profile
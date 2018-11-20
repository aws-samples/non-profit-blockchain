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

#REPODIR points to this repo.
REPODIR=~/non-profit-blockchain

#copy the connection profiles
mkdir -p $REPODIR/tmp/connection-profile/org1
mkdir -p $REPODIR/tmp/connection-profile/org2
cp ngo-connection-profile-template.yaml $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
cp client-org1.yaml $REPODIR/tmp/connection-profile/org1
cp client-org2.yaml $REPODIR/tmp/connection-profile/org2

#update the connection profiles with endpoints and other information
sed -i "s|%PEERNODEID%|$PEERNODEID|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%MEMBERID%|$MEMBERID|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%CAFILE%|$CAFILE|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%ORDERINGSERVICEENDPOINT%|$ORDERINGSERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%PEERSERVICEENDPOINT%|$ORDERINGSERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%CASERVICEENDPOINT%|$ORDERINGSERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%ADMINUSER%|$ORDERINGSERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
sed -i "s|%ADMINPWD%|$ORDERINGSERVICEENDPOINT|g" $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml

ls -lR $REPODIR/tmp/connection-profile
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

## TODO - we need the CERT TLS file to be created and made available on the client node
## Cert TLS file should be in secure S3 bucket. In this script we download it

sudo curl -L https://github.com/docker/compose/releases/download/1.20.0/docker-compose-`uname -s`-`uname -m` -o /usr/local/bin/docker-compose
sudo chmod a+x /usr/local/bin/docker-compose
sudo yum install libtool -y

## Install golang.  
wget https://dl.google.com/go/go1.10.3.linux-amd64.tar.gz
tar -xzf go1.10.3.linux-amd64.tar.gz
sudo mv go /usr/local

sudo yum install libtool-ltdl-devel -y
sudo yum install git -y

## Make changes to the bash_profile here
rm ~/.bash_profile
cat > ~/.bash_profile << EOF
# .bash_profile

# Get the aliases and functions
if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi

# User specific environment and startup programs
PATH=$PATH:$HOME/.local/bin:$HOME/bin

# GOROOT is the location where Go package is installed on your system
export GOROOT=/usr/local/go

# GOPATH is the location of your work directory
export GOPATH=$HOME/go

# PATH in order to access go binary system wide
export PATH=$GOROOT/bin:$PATH
EOF

source ~/.bash_profile

## Check versions
docker version
sudo /usr/local/bin/docker-compose version
go version

## Setup Fabric client
go get -u github.com/hyperledger/fabric-ca/cmd/...
cd /home/ec2-user/go/src/github.com/hyperledger/fabric-ca
make fabric-ca-client
export PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin # Add this to your.bash_profile to preserve across sessions

## Clone Fabric samples
cd ~
git clone https://github.com/hyperledger/fabric-samples.git

## Download the Fabric TLS cert
## TODO


## Run the CLI
docker-compose -f docker-compose-cli.yaml up &

## Enrol network member admin
## The variables needed below are exported from step1/2. 
export PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin
cd
fabric-ca-client enroll -u https://$ADMINUSER:$ADMINPWD@$CASERVICEENDPOINT --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M /home/ec2-user/admin-msp 
cp -r admin-msp/signcerts admin-msp/admincerts

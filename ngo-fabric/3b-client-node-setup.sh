#!/usr/bin/env bash

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
fabric-ca-client enroll -u https://<network-member-admin>:<network-member-password>@<nodedns>:<ca-port> --tls.certfiles /home/ec2-user/taiga-tls.pem -M /home/ec2-user/admin-msp 
cp -r admin-msp/signcerts admin-msp/admincerts

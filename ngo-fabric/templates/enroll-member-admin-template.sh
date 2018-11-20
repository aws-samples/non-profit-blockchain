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


## Enrol network member admin
## The variables needed below are exported from step1/2. I re-export them just in case:

export ADMINUSER=<the admin user name you entered when creating your Fabric network>
export ADMINPWD=<the admin user name you entered when creating your Fabric network>
export CASERVICEENDPOINT=<your Fabric certificate authority endpoint, under your member in the AWS Console>

export PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin
cd
fabric-ca-client enroll -u https://$ADMINUSER:$ADMINPWD@$CASERVICEENDPOINT --tls.certfiles /home/ec2-user/taiga-tls.pem -M /home/ec2-user/admin-msp 
cp -r admin-msp/signcerts admin-msp/admincerts

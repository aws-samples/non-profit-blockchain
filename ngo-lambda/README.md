# Part 6: Lambda functions to query and invoke chaincode

In this blog post we will learn how to publish a Lambda function to query a Hyperledger Fabric blockchain running on Amazon Managed Blockchain.  We will use the NodeJS Hyperledger Fabric SDK within the Lambda function to interface with the blockchain.

## Pre-requisites

From Cloud9, SSH into the Fabric client node. The key (i.e. the .PEM file) should be in your home directory. 
The DNS of the Fabric client node EC2 instance can be found in the output of the AWS CloudFormation stack you 
created in [Part 1](../ngo-fabric/README.md)

```
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

You should have already cloned this repo in [Part 1](../ngo-fabric/README.md)

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

You will need to set the context before carrying out any Fabric CLI commands. We do this 
using the export files that were generated for us in [Part 1](../ngo-fabric/README.md)

Source the file, so the exports are applied to your current session. If you exit the SSH 
session and re-connect, you'll need to source the file again. The `source` command below
will print out the values of the key ENV variables. Make sure they are all populated. If
they are not, follow Step 4 in [Part 1](../ngo-fabric/README.md) to repopulate them:

```
cd ~/non-profit-blockchain/ngo-fabric
source fabric-exports.sh
source ~/peer-exports.sh 
```

## Overview

The steps we will execute in this part are:

1. Download the Managed Blockchain certificate
2. Create user credentials
3. Create an S3 bucket to store the credentials
4. Put the certificates and credentials on S3
5. Copy the Fabric client configuration files
6. Install the npm dependencies
7. Create the IAM role and policies
8. Apply a policy to S3
9. Create the Lambda function
10. Test the Lambda function


## Step 1 - Download the Managed Blockchain certificate

Get the latest version of the Managed Blockchain PEM file. This will be use for securing communication with the Managed Blockchain service.

```
aws s3 cp s3://us-east-1.managedblockchain/etc/managedblockchain-tls-chain.pem  ~/non-profit-blockchain/ngo-lambda/certs/managedblockchain-tls-chain.pem
```

## Step 2 - Create user credentials

Register and enroll an identity with the Fabric CA (certificate authority). We will use this identity within the Lambda function.  In the example below we are creating a user named `lambdaUser` with a password of `Welcome123`.  The password is optional and one will be generated if not provided.

```
export PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin
cd ~
fabric-ca-client register --id.name lambdaUser --id.affiliation NGOEmile --tls.certfiles ~/managedblockchain-tls-chain.pem --id.type user --id.secret Welcome123
fabric-ca-client enroll -u https://lambdaUser:Welcome123@$CASERVICEENDPOINT --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M /tmp/certs/lambdaUser
```

## Step 3 - Create an S3 bucket

If you already have an S3 bucket you would like to use, you can skip this step and move on to step 3.

S3 buckets are globally unique, so you will need to use a different name than the one in this example.  In this example, we will create an S3 bucket named `mybucket` in the `us-east-1` region.

```
aws s3 mb s3://mybucket --region us-east-1
```

## Step 4 - Put the TLS certificate and user credentials on S3

Replace `mybucket` with your bucket name in each of the commands below, and then run them.

```
aws s3 cp ~/non-profit-blockchain/ngo-lambda/certs/managedblockchain-tls-chain.pem s3://mybucket  --region us-east-1
aws s3 cp /tmp/certs/lambdaUser s3://mybucket/lambdaUser --recursive --region us-east-1
```

## Step 5 - Copy the Fabric client configuration files

You should have created the Fabric client configuration files in Part 3.  If not, follow the instructions in [Part 3 - Step 3](../ngo-rest-api/README.md) before continuing.  Make sure to source the files mentioned in the **Pre-requisites** section of Part 3 before generating the configuration files.

Once the configuration files have been created, copy them to the local folder and update the path to the Managed Blockchain certificate.

```
cp ~/non-profit-blockchain/tmp/connection-profile/ngo-connection-profile.yaml ~/non-profit-blockchain/ngo-lambda/.
cp ~/non-profit-blockchain/tmp/connection-profile/org1/client-org1.yaml ~/non-profit-blockchain/ngo-lambda/.
sed -i "s|/home/ec2-user/managedblockchain-tls-chain.pem|./certs/managedblockchain-tls-chain.pem|g" ~/non-profit-blockchain/ngo-lambda/ngo-connection-profile.yaml
```

## Step 6 - Install the npm dependencies

You should have already installed `nvm` in a prior step.  If not, follow the instructions in [Part 3 - Step 1](../ngo-rest-api/README.md) before continuing.  Be sure to install the `gcc` compiler in that step.

```
cd ~/non-profit-blockchain/ngo-lambda
nvm use lts/carbon
npm install
```

## Step 7 - Create the IAM role and policies for Lambda

### Step 7a - Create the role
```
aws iam create-role --role-name Lambda-Fabric-Role --assume-role-policy-document file://Lambda-Fabric-Role-Trust-Policy.json
```

This will output a JSON representation of the new role.  Copy the output to a local document so you can refer back to it later.

### Step 7b - Add policies to the role

We need to grant an S3 and an execution policy to the role.

```
aws iam attach-role-policy --role-name Lambda-Fabric-Role --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name Lambda-Fabric-Role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
```

## Step 8 - Add a policy to S3 bucket

Edit `s3policy.json` and replace:
* `Statement.Principal.AWS` with the value of the `Role.Arn` attribute from the `create-role` output above.
* The instances of `mybucket` within `Statement.Resource` with your bucket name.

Save the file and exit the editor.

Replace `mybucket` with your bucket name in the command below, and then execute it.

```
aws s3api put-bucket-policy --bucket mybucket --policy file://s3policy.json
```

## Step 9 - Create the Lambda function

### Step 9a - Create the Lambda archive

Archive the Lambda code into a zip file.

```
cd ~/non-profit-blockchain/ngo-lambda
zip -r /tmp/ngo-lambda-query.zip  .
```

### Step 9b - Prepare and create the function
Before running `create-function` you will need to replace a few parameters with those from your environment.

From the AWS console, view the output of the [AWS Cloudformation](https://console.aws.amazon.com/cloudformation/home?region=us-east-1) stack you created in [Part 1](../ngo-fabric/README.md).  Click the 'Outputs' tab.

For SecurityGroupIds, replace `string` with the Cloudformation value for the key `SecurityGroupID`.
For SubnetIds, replace `string` with the Cloudformation value for the key `PublicSubnetID`.
For `role`, replace the arn from the output of step 8.

// Use the S3 information from Step 3 above for the `S3` settings.
For S3_CRYPTO_BUCKET, replace `mybucket` with the name of the bucket you created.
!! may not need the access key or secret access key !!

Once you have updated those environment variables, execute the `create-function` call below.

```
aws lambda create-function --function-name ngo-lambda-query --runtime nodejs8.10 --handler index.handler --role arn:aws:iam::XXXXXXXXXXXX:role/Lambda-Fabric-Role --vpc-config SubnetIds=string,SecurityGroupIds=string --environment Variables="{CA_ENDPOINT=$CASERVICEENDPOINT,PEER_ENDPOINT=grpcs://$PEERSERVICEENDPOINT,ORDERER_ENDPOINT=grpcs://$ORDERINGSERVICEENDPOINT,CHANNEL_NAME=$CHANNEL,CHAIN_CODE_ID=ngo,S3_CRYPTO_BUCKET=mybucket,CRYPTO_FOLDER=/tmp,MSP_ID=$MSP,FABRIC_USERNAME=lambdaUser}" --zip-file fileb:///tmp/ngo-lambda-query.zip --region us-east-1 --timeout 60
```

## Step 10 - Test the Lambda function

You can test the Lambda function from the [Lambda console](https://console.aws.amazon.com/lambda), or from the cli.

To test from the cli:
```
aws lambda invoke --function-name ngo-lambda-query --payload "{\"donorName\":\"michael\"}" /tmp/lambda-output.txt --region us-east-1
```
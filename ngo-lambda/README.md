# Part 6: Read and write to the blockchain with AWS Lambda

Part 6 will show you how to publish a Lambda function that invokes chaincode on a Hyperledger Fabric blockchain network running on Amazon Managed Blockchain.  You will use the NodeJS Hyperledger Fabric SDK within the Lambda function to interface with the blockchain.

## Pre-requisites
 There are multiple parts to the workshop.  Before starting on Part 6, you should have completed [Part 1](../ngo-fabric/README.md), [Part 2](../ngo-chaincode/README.md), and Step 1 and Step 3 of [Part 3](../ngo-rest-api/README.md#step-3---generate-a-connection-profile).

 In the AWS account where you [created the Fabric network](../ngo-fabric/README.md), use Cloud9 to SSH into the Fabric client node. The key (i.e. the .PEM file) should be in your home directory. The DNS of the Fabric client node EC2 instance can be found in the output of the CloudFormation stack you created in [Part 1](../ngo-fabric/README.md).

```
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

You should have already cloned this repo in [Part 1](../ngo-fabric/README.md).

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

You will need to set the context before carrying out any Fabric CLI commands. You do this 
using the export files that were generated for us in [Part 1](../ngo-fabric/README.md).

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

The steps you will execute in this part are:

1. Create a staging folder for the Lambda deployment bundle
2. Copy the Managed Blockchain certificate
3. Create the Fabric user credentials
4. Put user credentials on Secrets Manager
5. Copy the Fabric connection profiles
6. Install the npm dependencies
7. Create the IAM role and policies
8. Create the Lambda function
9. Create a VPC Endpoint to Secrets Manager
10. Test the Lambda function

This architecture diagram illustrates how the Lambda function you will build and deploy fits within the overall architecture.

![Architecture Diagram](./Lambda%20Architecture%20Diagram.png)

## Step 1 - Create a staging folder for the Lambda deployment bundle

Copy the source folder into a staging folder you can use for preparing the deployment bundle you will deploy to Lambda.

```
cp -R ~/non-profit-blockchain/ngo-lambda /tmp/lambdaWork
```

## Step 2 - Copy the Managed Blockchain certificate

Copy the latest version of the Managed Blockchain PEM file into the staging folder. This will be used to secure communication with the Managed Blockchain service.

```
cp ~/managedblockchain-tls-chain.pem /tmp/lambdaWork/certs/managedblockchain-tls-chain.pem
```

## Step 3 - Create the Fabric user credentials

Register and enroll an identity with the Fabric CA (certificate authority). You will use this identity within the Lambda function.  In the example below you are creating a user named `lambdaUser` with a password of `Welcome123`.  The password is optional and one will be generated if not provided.  The credentials will be written into `/tmp/certs/lambdaUser/keystore` and `/tmp/certs/lambdaUser/signcerts`.

```
export FABRICUSER=lambdaUser
export FABRICUSERPASSWORD=Welcome123
export PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin
cd ~
fabric-ca-client register --id.name $FABRICUSER --id.affiliation $MEMBERNAME --tls.certfiles ~/managedblockchain-tls-chain.pem --id.type user --id.secret $FABRICUSERPASSWORD
fabric-ca-client enroll -u https://$FABRICUSER:$FABRICUSERPASSWORD@$CASERVICEENDPOINT --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M /tmp/certs/$FABRICUSER
```

## Step 4 - Put user credentials on Secrets Manager ##
```
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRICUSER/pk" --secret-string "`cat /tmp/certs/$FABRICUSER/keystore/*`" --region $REGION
aws secretsmanager create-secret --name "dev/fabricOrgs/$MEMBERNAME/$FABRICUSER/signcert" --secret-string "`cat /tmp/certs/$FABRICUSER/signcerts/*`" --region $REGION
```

## Step 5 - Copy the Fabric client connection profiles

You should have created the Fabric connection profiles in Part 3.  If not, follow the instructions in [Part 3 - Step 3](../ngo-rest-api/README.md) before continuing.  Make sure to source the files mentioned in the **Pre-requisites** section of Part 3 before generating the connection profiles.

Once the connection profiles have been created, copy them to the staging folder and update the path to the Managed Blockchain certificate.

```
cp ~/non-profit-blockchain/tmp/connection-profile/ngo-connection-profile.yaml /tmp/lambdaWork/.
cp ~/non-profit-blockchain/tmp/connection-profile/org1/client-org1.yaml /tmp/lambdaWork/.
sed -i "s|/home/ec2-user/managedblockchain-tls-chain.pem|./certs/managedblockchain-tls-chain.pem|g" /tmp/lambdaWork/ngo-connection-profile.yaml
```

## Step 6 - Install the npm dependencies

You should have already installed `nvm` in a prior step.  If not, follow the instructions in [Part 3 - Step 1](../ngo-rest-api/README.md) before continuing.  Be sure to install the `gcc` compiler in that step.

```
cd /tmp/lambdaWork
nvm use lts/carbon
npm install
```

If you get an error indicating `"Cannot find module 'fabric-client'"` you will need to install the `gcc` compiler, and rerun the install.

```
sudo yum install gcc-c++ -y
npm install
```

## Step 7 - Create the IAM role and policies for Lambda

### Step 7a - Create the role

You need to create an IAM role for the Lambda function and grant it the necessary permissions to access our blockchain network and the Fabric credentials in Secrets Manager.

```
aws iam create-role --role-name Lambda-Fabric-Role --assume-role-policy-document file://Lambda-Fabric-Role-Trust-Policy.json > /tmp/lambdaFabricRole-output.json
```

The `create-role` command outputs a JSON representation of the new role.  You capture this output in `lambdaFabricRole-output.json` as you will need to refer back to it later when we create the Lambda function.

### Step 7b - Add policies to the role

You need to grant Lambda execution and Secrets Manager policies to the role.

```
aws iam attach-role-policy --role-name Lambda-Fabric-Role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
aws iam put-role-policy --role-name Lambda-Fabric-Role --policy-name SecretsManagerPolicy --policy-document file://Secrets-Manager-Policy.json
```

## Step 8 - Create the Lambda function

### Step 8a - Create the Lambda archive

Archive the Lambda code into a zip file.

```
cd /tmp/lambdaWork
zip -r /tmp/ngo-lambda-function.zip  .
```

### Step 8b - Prepare and create the function

You now have everything you need to create the Lambda function, including the IAM role with the required policies, and the code archive.  You will need to set a few input parameters to pass into the `create-function` call.  We will do this by setting environment variables for the role ARN from the output of step 7a, and the SubnetID and SecurityGroupID, which are retrieved from our CloudFormation stack outputs.

You can set these environment variables by issuing these commands. 

```
export ROLE_ARN=$(grep -o '"Arn": *"[^"]*"' /tmp/lambdaFabricRole-output.json | grep -o '"[^"]*"$' | tr -d '"')
export SUBNETID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text)
export SECURITYGROUPID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text)
```

Once you have set the environment variables, execute the `create-function` call below.

```
aws lambda create-function --function-name ngo-lambda-function --runtime nodejs8.10 --handler index.handler --memory-size 512 --role $ROLE_ARN --vpc-config SubnetIds=$SUBNETID,SecurityGroupIds=$SECURITYGROUPID --environment Variables="{CA_ENDPOINT=$CASERVICEENDPOINT,PEER_ENDPOINT=grpcs://$PEERSERVICEENDPOINT,ORDERER_ENDPOINT=grpcs://$ORDERINGSERVICEENDPOINT,CHANNEL_NAME=$CHANNEL,CHAIN_CODE_ID=ngo,CRYPTO_FOLDER=/tmp,MSP=$MSP,FABRICUSER=$FABRICUSER,MEMBERNAME=$MEMBERNAME}" --zip-file fileb:///tmp/ngo-lambda-function.zip --region $REGION --timeout 30
```

If you get an error indicating `Function already exist: ngo-lambda-function`, you can update the existing Lambda using the commands below.  The first command updates the configuration of the Lambda function.  The second command updates the code archive.

First, update the runtime configuration:
```
aws lambda update-function-configuration --function-name ngo-lambda-function --runtime nodejs8.10 --handler index.handler --memory-size 512 --role $ROLE_ARN --vpc-config SubnetIds=$SUBNETID,SecurityGroupIds=$SECURITYGROUPID --environment Variables="{CA_ENDPOINT=$CASERVICEENDPOINT,PEER_ENDPOINT=grpcs://$PEERSERVICEENDPOINT,ORDERER_ENDPOINT=grpcs://$ORDERINGSERVICEENDPOINT,CHANNEL_NAME=$CHANNEL,CHAIN_CODE_ID=ngo,CRYPTO_FOLDER=/tmp,MSP=$MSP,FABRICUSER=$FABRICUSER,MEMBERNAME=$MEMBERNAME}" --timeout 30
```

Next, update the code archive:
```
aws lambda update-function-code --function-name ngo-lambda-function --zip-file fileb:///tmp/ngo-lambda-function.zip --region $REGION
```

## Step 9 - Create a VPC Endpoint to Secrets Manager

The Lambda function will run within a VPC, and therefore requires a VPC Endpoint to communicate with Secrets Manager.  You will do this with the `create-vpc-endpoint` command.

Before executing this command, you will need to set the VPC ID in an environment variable.

```
export VPCID=$(aws cloudformation --region $REGION describe-stacks --stack-name $NETWORKNAME-fabric-client-node --query "Stacks[0].Outputs[?OutputKey=='VPCID'].OutputValue" --output text)
```

You also need the subnet ID and security group ID, which you already set in step 8b.  Once you have set the environment variables, you can create the VPC endpoint with this command.

```
aws ec2 create-vpc-endpoint --vpc-id $VPCID --vpc-endpoint-type Interface --subnet-ids $SUBNETID --service-name com.amazonaws.us-east-1.secretsmanager --security-group-id $SECURITYGROUPID --region $REGION
```

## Step 10 - Test the Lambda function

You can test the Lambda function from the [Lambda console](https://console.aws.amazon.com/lambda), or from the cli.

To test from the cli, you will execute the commands below.  The output of each command is in the file specified in the last argument, and is displayed via `cat`.

First, call the `createDonor` chaincode function to create the donor "melissa".
```
aws lambda invoke --function-name ngo-lambda-function --payload '{"functionType": "invoke","chaincodeFunction": "createDonor","chaincodeFunctionArgs": {"donorUserName":"melissa","email":"melissa@melissasngo.org"}}' --region $REGION /tmp/lambda-output-createDonor.txt
cat /tmp/lambda-output-createDonor.txt
```

Next, call the `queryDonor` function to view the details of the donor we just created.
```
aws lambda invoke --function-name ngo-lambda-function --payload '{"functionType":"query","chaincodeFunction":"queryDonor","chaincodeFunctionArgs":{"donorUserName":"melissa"}}' --region $REGION /tmp/lambda-output-queryDonor.txt
cat /tmp/lambda-output-queryDonor.txt
```

Finally, call the `queryAllDonors` function to view all the donors.
```
aws lambda invoke --function-name ngo-lambda-function --payload '{"functionType":"query","chaincodeFunction":"queryAllDonors","chaincodeFunctionArgs":{}}' --region $REGION /tmp/lambda-output-queryAllDonors.txt
cat /tmp/lambda-output-queryAllDonors.txt
```

You now have a Lambda function that is querying the blockchain.  You can use this Lambda function to service API Gateway requests as part of a serverless architecture.

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../ngo-chaincode/README.md) Deploy the non-profit chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the RESTful API server. 
* [Part 4:](../ngo-ui/README.md) Run the application. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 
* [Part 6:](../ngo-lambda/README.md) Read and write to the blockchain with AWS Lambda.

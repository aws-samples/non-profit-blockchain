# Part 9: Integrating blockchain users with Amazon Cognito

A Hyperledger Fabric blockchain network is comprised of multiple members, each of whom is responsible for managing their own users.  They do this with a Certificate Authority (CA). The CA serves two primary purposes:

* registering new users, and defining their role, their organization, and other attributes
* enrolling users and generating enrollment credentials, which creates private keys and public certificates

Enrollment credentials are used when issuing blockchain transactions.  Blockchain transactions must be signed with a user’s private key, which identifies the user within the context of that transaction.  This identity, which includes the user’s role, organization, and other attributes defined during registration, can be used to enable access control within a smart contract, such as ensuring only admins perform a particular function.  The identity can also be used to record information about the user within the blockchain ledger, such as defining the owner of a digital asset.  Because private keys represent a user, they should be treated as passwords, and properly secured and protected.

### Using blockchain credentials as part of web application authentication

Web applications commonly require users to authenticate with a username and password.  Users are authenticated against a user database, such as Amazon Cognito.  In this workshop we will look at how we can continue providing a username and password authentication scheme while not requiring the user to maintain their private keys.

In previous parts of this workshop, we created a transparent NGO donation application that allows donors to see how their NGO donations are being spent.  In the application, all users, such as donors and NGO organization members, are able to access all of the smart contract functions.  In this part, we will continue building on this application and restrict certain smart contract functions to only be available to NGO organization managers.  We will do this using Hyperledger Fabric's native [attribute-based access control](https://hyperledger-fabric-ca.readthedocs.io/en/release-1.4/users-guide.html#attribute-based-access-control).

We will also create a Cognito user pool with users corresponding to the blockchain identities (donors and managers), and use this Cognito user pool to provide authentication to an API Gateway.  For more details on how API Gateway uses Cognito user pools for authorization, please refer to [this guide](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-integrate-with-cognito.html).

## Pre-requisites
 There are multiple parts to the workshop.  Before starting on Part 8, you should have completed [Part 1](../ngo-fabric/README.md), [Part 2](../ngo-chaincode/README.md), and [Part 6](../ngo-lambda/README.md).

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

## Solution Overview

This architecture diagram illustrates the solution you will be building.

![Architecture Diagram](./Blockchain%20Identity%20Components.png)

The blockchain user is registered (created) in the Certificate Authority, and their enrollment credentials are stored in AWS Secrets Manager.  A corresponding user is also created within a Cognito User Pool, with a custom attribute, `fabricUsername`, that identifies this user within the Certificate Authority.

The client application attempts to authenticate the user (via username and password) against a Cognito User Pool. Upon successful authentication, Cognito returns an identity token, which is a JSON Web Token (JWT). The client application includes this JWT in requests sent to the API Gateway, which authorizes the user to invoke the API route.

API Gateway retrieves the `fabricUsername` custom attribute from the JWT, and sends this to the Lambda function that will be executing the blockchain transaction.  The Lambda retrieves the blockchain user's private key from AWS Secrets Manager, and retrieves the connection profile for connecting to the Amazon Managed Blockchain network from Amazon Systems Manager (Parameter Store).  IAM policies are used to restrict access to Secrets Manager and Systems Manager to only the Lambda function.

Lastly, we will upgrade our [Fabric chaincode](./chaincode/src/ngo.js) to add new methods that use attribute-based access to restrict who can invoke the method.  Here is a snippet of the function that retrieves information about the invoking user:

```
function getClientIdentity(stub) {
  const ClientIdentity = shim.ClientIdentity;
  let cid = new ClientIdentity(stub);
  let result = {}
  result['getID'] = cid.getID();
  result['getMSPID'] = cid.getMSPID();
  result['getX509Certificate'] = cid.getX509Certificate();
  result['role'] = cid.getAttributeValue("role"); //e.g. acme_operations
  result['affiliation'] = cid.getAttributeValue("hf.Affiliation"); //member name, e.g. ACME
  result['enrollmentID'] = cid.getAttributeValue("hf.EnrollmentID"); //the username, e.g. ngoDonor
  result['fullname'] = cid.getAttributeValue("fullname"); //e.g. Bob B Donor
  return result;
}
```

## Sequence Diagram

This diagram shows the sequence of events that transpire to authenticate a user and invoke blockchain transactions on their behalf.
![Sequence Diagram](./Blockchain%20Identity%20Sequence%20Diagram.png)

## Solution Steps 

The steps you will execute in this part are:

1. Create Fabric users in the Certificate Authority
2. Deploy a Cognito User Pool
3. Deploy API Gateway routes that require Cognito authentication
4. Create users in the Cognito User Pool
5. Upgrade chaincode

## Step 1 - Create Fabric users in the Certificate Authority
On the Fabric client node.

On our Certificate Authority, we will create two users, one for the donor, and one for the manager.  Execute this script to create these users called `ngoDonor` and `ngoManager`.

```
~/non-profit-blockchain/ngo-identity/scripts/createFabricUsers.sh
```

Within this script, we define various attributes on the users' certificates. These attributes are available within the smart contract and can be used to enforce attribute-based access.  You can find more detail on creating Fabric users in the [Fabric documentation](https://hyperledger-fabric-ca.readthedocs.io/en/release-1.4/users-guide.html#fabric-ca-client).

In this example, we define two attributes named `fullname` and `role`.

```
--id.attrs "fullname='Bob D Donor':ecert,role=ngo_donor:ecert"
```

## Steps 2-3 - Deploy a Cognito User Pool, and API Gateway routes
In this step we deploy the Cognito User Pool, and API Gateway routes that require authentication with the Cognito User Pool.  API Gateway will fulfill these routes using the Lambda function that was deployed in [Part 6](../ngo-lambda/README.md).  The new API Gateway routes are:

* /donors - returns information about all donors.  This route is available to all authenticated users
* /donorsmanager - same as the above route, but restricted to authenticated users with the necessary attributes
* /user - returns information about the calling user.  Useful for debugging

Create these assets by running the script (this will take a few minutes):

```
~/non-profit-blockchain/ngo-identity/scripts/deployCognitoAPIGatewayRoutes.sh
```

## Step 4 - Create users in the Cognito User Pool
In this step we create two users within the Cognito user pool.  One user represents a donor, and the other represents a manager, who will have elevated access. 

Create the users by running the script: 

```
~/non-profit-blockchain/ngo-identity/scripts/createCognitoUsers.sh
```

## Step 5 - Upgrade the NGO chaincode
The final step is to upgrade the NGO chaincode with the new methods we will need to support our application. Copy the chaincode to the directory where the Fabric CLI container expects to find the chaincode source code.

```
cp ~/non-profit-blockchain/ngo-identity/chaincode/src/* ~/fabric-samples/chaincode/ngo
```

Install the chaincode on the peer node.

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER" cli peer chaincode install -n ngo -l node -v v2 -p /opt/gopath/src/github.com/ngo
```

If this is successful you should see a message like this:

```
INFO 004 Installed remotely response:<status:200 payload:"OK" >
```

Next, upgrade the chaincode.

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" -e "CORE_PEER_ADDRESS=$PEER" cli peer chaincode upgrade -o $ORDERER -C mychannel -n ngo -v v2 -c '{"Args":[""]}' --cafile /opt/home/managedblockchain-tls-chain.pem --tls
```

# Testing

Now that we've created everything, let's see it all in action.

First, we'll set a few environment variables which will allow us to retrieve the API endpoint and the Cognito App Client ID from our Cloudformation stacks. Run the following commands to set the environment variables.

```
REGION=us-east-1
COGNITO_APIG_LAMBDA_STACK_NAME=cognito-apig-lambda-stack

API_URL=$(aws cloudformation describe-stacks --stack-name $COGNITO_APIG_LAMBDA_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='APIGatewayURL'].OutputValue" --output text --region $REGION )

COGNITO_APP_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $COGNITO_APIG_LAMBDA_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CognitoAppClientID'].OutputValue" --output text --region $REGION )

API_URL_DONORS=$API_URL/donors
API_URL_DONORSMANAGER=$API_URL/donorsmanager
API_URL_USER=$API_URL/user
```

## Calling API without authorization

Next, let's try to query the API without providing any authorization.
```
curl -s -X GET "$API_URL_DONORS"
```

You should see an authorized response:
```
{"message":"Unauthorized"}
```

## Calling API with authorization for donor user
Next, we will authenticate against the Cognito user pool, which returns an id token we will use to authenticate against API Gateway
```
ID_TOKEN=$(aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --auth-parameters USERNAME=bobdonor,PASSWORD=Welcome123! --client-id $COGNITO_APP_CLIENT_ID --region $REGION --output text --query 'AuthenticationResult.IdToken')
```

Let's see what this id token looks like. 
```
echo $ID_TOKEN
```

The id token is a JSON Web Token (JWT) which contains various information about the authenticated user.  You can use a JWT parsing utility, or a site like jwt.io to see the contents of the JWT.  Here's an example representation; note the `fabricUsername` attribute, which identifies the user in the Certificate Authority:

```
{
  "sub": "e6add7b3-xxxxx",
  "aud": "3q0bnxxxxx",
  "event_id": "d41d634a-xxxxx",
  "token_use": "id",
  "custom:fabricUsername": "ngoDonor",
  "auth_time": 1597273756,
  "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_xxxxx",
  "cognito:username": "bobdonor",
  "exp": 1597277356,
  "iat": 1597273757
}
```

Next, we'll call the API again, but this time we will send an Authorization header with the access token.

```
curl -H "Authorization: $ID_TOKEN" -s -X GET "$API_URL_DONORS"
```

You should see a response showing all donors.

Next, we'll try calling the restricted endpoint.

```
curl -H "Authorization: $ID_TOKEN" -s -X GET "$API_URL_DONORSMANAGER"
```

As expected, this fails because our user is not a manager.  You should see an error response that mentions:
```
User must have ngo_manager role to call this function.
```

We can see the user attributes available to the smart contract by calling this route.

```
curl -H "Authorization: $ID_TOKEN" -s -X GET "$API_URL_USER"
```

This returns a string representation of a JSON object containing several attributes.  Parsing the string, we can see some of the attributes we defined when creating the user in step 1.

```
{ fullname: "'Bob D Donor'", hf.Affiliation: "Org1", hf.EnrollmentID: "ngoDonor", role: "ngo_donor" }
```

## Calling API with authorization for manager user
Next, we will authenticate as the manager user.
```
ID_TOKEN=$(aws cognito-idp initiate-auth --auth-flow USER_PASSWORD_AUTH --auth-parameters USERNAME=alicemanager,PASSWORD=Welcome123! --client-id $COGNITO_APP_CLIENT_ID --region $REGION --output text --query 'AuthenticationResult.IdToken')
```

If we look at this JWT, we can see that the `fabricUsername` is different, and now represents the `ngoManager` user in the Certificate Authority:

```
{
  ...
  "custom:fabricUsername": "ngoManager"
}
```

Next, we'll call the restricted endpoint, sending the JWT as an authorization header.

```
curl -H "Authorization: $ID_TOKEN" -s -X GET "$API_URL_DONORSMANAGER"
```

You should see a response showing all donors.

## Viewing the calling user's attributes
It can be helpful during debugging to know what attributes are available within the smart contract. When we upgraded our chaincode, we included a method that returns the attributes associated with the caller. We can see these attributes by calling this route.

```
curl -H "Authorization: $ID_TOKEN" -s -X GET "$API_URL_USER"
```

Which returns this result:

```
{
   "getID":"x509::/C=US/ST=North Carolina/O=Hyperledger/OU=user+OU=member/CN=ngoManager::/C=US/ST=Washington/L=Seattle/O=Amazon Web Services, Inc./OU=Amazon Managed Blockchain/CN=member Amazon Managed Blockchain Root CA",
   "getMSPID":"m-abc123...",
   "getX509Certificate":{...},
   "role":"ngo_manager",
   "affiliation":"member",
   "enrollmentID":"ngoManager",
   "fullname":"'Alice Manager'"
}
```

# Summary

Congratulations on completing this part of the workshop.  You now have an API Gateway that authorizes users against a Cognito User Pool.  This authorization is sent to a Lambda function that invokes blockchain transactions on behalf of this user.  All of the sensitive blockchain credentials, such as private keys, remain within AWS in Secrets Manager, ensuring a high level of security and trust in those using the credentials.

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../ngo-chaincode/README.md) Deploy the non-profit chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the RESTful API server. 
* [Part 4:](../ngo-ui/README.md) Run the application. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 
* [Part 6:](../ngo-lambda/README.md) Read and write to the blockchain with Amazon API Gateway and AWS Lambda.
* [Part 7:](../ngo-events/README.md) Use blockchain events to notify users of NGO donations.
* [Part 8:](../blockchain-explorer/README.md) Deploy Hyperledger Explorer.
* [Part 9:](../ngo-identity/README.md) Integrating blockchain users with Amazon Cognito.
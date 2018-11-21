# REST API to expose the Chaincode

The REST API is a Node.js application that uses the Fabric SDK to interact with the Fabric chaincode
and exposes the chaincode functions as REST APIs. This allows loose coupling between the UI application
and the underlying Fabric chaincode.

## The REST API Server on the Fabric client node
For the Fabric workshop, the REST API server will run on the Fabric client node.

From Cloud9, SSH into the Fabric client node. The key should be in your home directory. The DNS of the
EC2 instance can be found in the output of the CloudFormation stack you created when setting up the
Fabric network.

```
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

You should have already cloned the repo below. You would have done this when setting up the
Fabric network.

```
cd
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

### Install Node
On the Fabric client node.

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
```

```
. ~/.nvm/nvm.sh
nvm install lts/carbon
nvm use lts/carbon
```

Amazon Linux seems to be missing g++, so:

```
sudo yum install gcc-c++
```

### Npm install

```
cd ~/non-profit-blockchain/ngo-rest-api
npm install
```

## Generate a connection profile

The REST API needs a connection profile to connect to the Fabric network. The instructions below will 
auto-generate a connection profile. All of the information to create the connection profile is in 
our Cloud9 environment, so we will generate the profile there and copy it to our client node.

In Cloud9:
Make sure you still have the ENV variables set, which were populated when you built the Fabric network.
If not, follow these steps. You can run these steps and the `source` command multiple times without side effects.

Create the file that includes the ENV export values that define your Fabric network configuration.

```
cd ~/non-profit-blockchain/ngo-fabric
cp templates/exports-template.sh fabric-exports.sh
vi fabric-exports.sh
```

Update the export statements at the top of the file. The info you need either matches what you 
entered when creating the Fabric network in Step 1, or can be found in the AWS Managed Blockchain Console,
under your network.

Source the file, so the exports are applied to your current Cloud9 session. If you exit the Cloud9
session and re-enter, you'll need to source the file again.

```
cd ~/non-profit-blockchain/ngo-fabric
source fabric-exports.sh
```

Now generate the connection profile and check that the connection profile contains all of the
endpoints and other information:

```
cd ~/non-profit-blockchain/ngo-rest-api/connection-profile
./gen-connection-profile.sh
more ~/non-profit-blockchain/tmp/connection-profile/ngo-connection-profile.yaml
```

Check the config file used by app.js. Make sure the peer name in config.json is the same as the
peer name in the connection profile. Also check that the admin username and password are correct.

```
cd ~/non-profit-blockchain/ngo-rest-api
vi config.json
```

config.json should look something like this:

```
{
    "host":"localhost",
    "port":"3000",
    "channelName":"mychannel",
    "chaincodeName":"ngo",
    "eventWaitTime":"30000",
    "peers":[
        "peer1"
    ],
    "admins":[
       {
          "username":"admin",
          "secret":"adminpwd"
       }
    ]
 }
```

## Run the REST API Node.js application

Run the app (in the background if you prefer):

```
node app.js &
```

# REST API 
Once the app is running you can register an identity, and then start to execute chaincode

## Register/enroll a user:

request:
curl -s -X POST http://localhost:3000/users -H "content-type: application/x-www-form-urlencoded" -d 'username=michael&orgName=Org1'

response:
{"success":true,"secret":"","message":"michael enrolled Successfully"}

## GET methods

### Get all donors

request:
curl -s -X GET   "http://localhost:3000/donors" -H "content-type: application/json"

response:
[
    {"docType":"donor","donorUserName":"braendle","email":"braendle@abc.com","registeredDate":"2018-10-26"},
    {"docType":"donor","donorUserName":"edge","email":"edge@abc.com","registeredDate":"2018-10-25"}
]

## POST methods

### POST Donor

request:
curl -s -X POST "http://localhost:3000/donors" -H "content-type: application/json" -d '{ 
   "donorUserName": "edge", 
   "email": "edge@def.com", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}'

response:
A transaction ID, which can be ignored:

d5b8bc766e0ada43db013643fc17f397eacdb3e95e22ef48271ad5fb33e5abe7

# Testing
We can test the node application locally or on an EC2 instance. When testing on an EC2 instance 
we need to keep the REST API node application running after we exit the SSH session. I use PM2 to do 
this. `pm2 start app.js` will keep the app running, and logs can be found in `~/.pm2/logs`

# Troubleshooting

Error: [2018-11-06T11:44:51.485] [ERROR] Helper - ##### getRegisteredUser - Failed to get registered user: michael with error: TypeError: Cannot read property 'curve' of undefined

Solution: make sure the certificate stores are removed before starting the REST api. Using `./start.sh` will remove these. The 
error is caused by using the wrong certificate - probably an old one from the cert store.


[2018-11-16T10:25:40.240] [ERROR] Connection - ##### getRegisteredUser - Failed to get registered user: 5742cbbe-03b6-449d-ab65-3c885b6bfee1 with error: Error: Enrollment failed with errors [[{"code":19,"message":"CA 'ca.esxh3vewtnhsrldv5du3p52zpq' does not exist"}]]

We need to the name of the Fabric CA, as set in the CA, in FABRIC_CA_SERVER_CA_NAME
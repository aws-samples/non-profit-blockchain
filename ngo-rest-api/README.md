# Part 3: RESTful API to expose the Chaincode

The RESTful API is a Node.js application that uses the Fabric SDK to interact with the Fabric chaincode
and exposes the chaincode functions as REST APIs. This allows loose coupling between the UI application
and the underlying Fabric network.

## Pre-requisites
For the Fabric workshop, the REST API server will run on the Fabric client node.

From Cloud9, SSH into the Fabric client node. The key (i.e. the .PEM file) should be in your home directory. 
The DNS of the Fabric client node EC2 instance can be found in the output of the CloudFormation stack you 
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
```

## Step 1 - Install Node
On the Fabric client node.

Install Node.js. We will use v8.x.

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
sudo yum install gcc-c++ -y
```

## Step 2 - Install dependencies
On the Fabric client node.

```
cd ~/non-profit-blockchain/ngo-rest-api
npm install
```

## Step 3 - Generate a connection profile
On the Fabric client node.

The REST API needs a connection profile to connect to the Fabric network. Connection profiles describe
the Fabric network and provide information needed by the Node.js application in order to connect to the
Fabric network. The instructions below will auto-generate a connection profile. 

Generate the connection profile using the script below and check that the connection profile contains 
URL endpoints for the peer, orderer and CA, an 'mspid', a 'caName', and that the admin username and password
match those you entered when creating the Fabric network. If they do not match, edit the connection profile
and update them. The connection profile can be found here: `~/non-profit-blockchain/tmp/connection-profile/ngo-connection-profile.yaml`

```
cd ~/non-profit-blockchain/ngo-rest-api/connection-profile
./gen-connection-profile.sh
more ~/non-profit-blockchain/tmp/connection-profile/ngo-connection-profile.yaml
```

Check the config file used by app.js. Make sure the peer name in config.json (under 'peers:') is 
the same as the peer name in the connection profile. Also check that the admin username and 
password are correct and match the values you updated in the connection profile.

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

## Step 4 - Run the REST API Node.js application
On the Fabric client node.

Run the app (in the background if you prefer):

```
cd ~/non-profit-blockchain/ngo-rest-api
nvm use lts/carbon
node app.js &
```

## Step 5 - Test the REST API
On the Fabric client node.

Once the app is running you can register an identity, and then start to execute chaincode. The command
below registers a user identity with the Fabric CA. This user identity is then used to run chaincode
queries and invoke transactions.

### Register/enroll a user:

request:
```
curl -s -X POST http://localhost:3000/users -H "content-type: application/x-www-form-urlencoded" -d 'username=michael&orgName=Org1'
```

response:
```
{"success":true,"secret":"","message":"michael enrolled Successfully"}
```

### POST a Donor

request:
```
curl -s -X POST "http://localhost:3000/donors" -H "content-type: application/json" -d '{ 
   "donorUserName": "edge2", 
   "email": "edge2@def.com", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}'
```

response:
A transaction ID, which can be ignored:

```
{"transactionId":"2f3f3a85340bde09b505b0d37235d1d32a674e43a66229f9a205e7d8d5328ed1"}
```

### Get all donors

request:
```
curl -s -X GET   "http://localhost:3000/donors" -H "content-type: application/json"
```

response:
```
[
    {"docType":"donor","donorUserName":"edge","email":"edge@def.com","registeredDate":"2018-10-22T11:52:20.182Z"}
]
```
## Step 6 - Load the workshop test data
In your Cloud9 terminal.

You can do this step from anywhere as it accesses the ELB DNS endpoint. Executing this from the SSH
session is challenging as the SSH session will be outputting a range of INFO logs, which makes it
challenging to edit files. So we'll do this from Cloud9.

Loading the test data uses cURL commands similar to those you used above to test the API. You can 
use the same endpoint (i.e. localhost), since you will load the test data from the Fabric client node,
or you can use the AWS Elastic Load Balancer (ELB) that is used to expose your REST API. To find the 
DNS endpoint for the ELB, go to the CloudFormation stack created in [Part 1](../ngo-fabric/README.md)
and look in Outputs. If you receive an error using the ELB it might be because the underlying EC2 
instance has not moved to an 'InService' state. This will happen once the REST API server is running
and the ELB is able to execute the desired number of health checks against it. You can check the 
status in the EC2 console, under Load Balancers.

```
cd ~/non-profit-blockchain/ngo-rest-api
vi ngo-load-workshop.sh
```

The line to be changed is this one. It can either point to `localhost` or your ELB DNS. If you
use `localhost` you also need to change the port to `3000`:

```
export ENDPOINT=ngo10-elb-2090058053.us-east-1.elb.amazonaws.com
export PORT=80
```

After saving the changes, run the script:

```
cd ~/non-profit-blockchain/ngo-rest-api
./ngo-load-workshop.sh
```

# Testing
We can test the Node.js application locally or on an EC2 instance. The workshop runs the REST API on
the Fabric client node. If you exit the SSH session on the Fabric client node, the running REST API 
will automatically exit.

For purposes of the workshop we can just leave the SSH session open. However, if we need to keep the REST 
API application running after we exit the SSH session, we can use various methods to do this. I use `PM2`,
using a command such as `pm2 start app.js`, which will keep the app running. The logs can be found in `~/.pm2/logs`.

## Move on to Part 4
The workshop instructions can be found in the README files in parts 1-4:

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Amazon Managed Blockchain Hyperledger Fabric network.
* [Part 2:](../ngo-chaincode/README.md) Deploy the NGO chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the REST API. 
* [Part 4:](../ngo-ui/README.md) Run the Application. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 

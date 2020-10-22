# Running Hyperledger Explorer on Amazon Managed Blockchain

Customers want to visualise their Fabric networks on Amazon Managed Blockchain. Hyperledger Explorer is an open source browser for viewing activity on the underlying Fabric network. It offers a web application that provides a view into the configuration of the Fabric network (channels, chaincodes, peers, orderers, etc.), as well as the activity taking place on the network (transactions, blocks, etc.). With a few tweaks, it can easily be used with Amazon Managed Blockchain.

An Amazon Managed Blockchain network provisioned based on the steps in [Part 1](../ngo-fabric/README.md) is a pre-requisite. The steps in this README will provision and run the Hyperledger Explorer sync & web app components on the Fabric client node you created in [Part 1](../ngo-fabric/README.md).

Hyperledger Explorer consists of a few components:

* a database that stores the Fabric network configuration, such as peers, orderers, as well as details of the chaincodes, channels, blocks & transactions
* a 'sync' component that regularly queries the Fabric network for changes to the config and details of new transactions and blocks
* a web application the provides a view of the current network state

We will configure Hyperledger Explorer to use an Amazon RDS PostgreSQL instance so we can benefit from a managed database service, rather than running PostgreSQL locally. 

The instructions below are complete. You can refer to the instructions in the [Hyperledger Explorer GitHub repo](https://github.com/hyperledger/blockchain-explorer) for reference, but you do not need to use them.

## Pre-requisites

An Amazon Managed Blockchain network provisioned based on the steps in [Part 1](../ngo-fabric/README.md) is a pre-requisite. The CIDR range of the subnet used by the Fabric client node has been changed to accommodate the additional subnets required by Hyperledger Explorer (see the [CloudFormation template](../ngo-fabric/fabric-client-node.yaml)), so if you previously completed [Part 1](../ngo-fabric/README.md) you will either need to recreate your Fabric client node VPC (i.e. delete the CloudFormation stack you created in step 3 of [Part 1](../ngo-fabric/README.md)), or you can simply create a new Fabric network starting from step 1 of [Part 1](../ngo-fabric/README.md).

If you have multiple peer nodes for your member, the Fabric discovery service will discover them and display them in the Explorer dashboard.

If you have a multi-member Fabric network, you must configure anchor peers for the member(s), otherwise the Fabric discovery service will be unable to discover peers belonging to other members. Instructions on how to do this can be found [here](https://docs.aws.amazon.com/managed-blockchain/latest/managementguide/hyperledger-anchor-peers.html). Carry out these instructions from the Fabric client node. However, note that the instructions in the AWS docs assume you created a Managed Blockchain network following the instructions in the 'Getting Started' guide, which builds a Fabric client node from scratch. In contrast, this repo uses a pre-built AMI. You will need to add additional environment variables to the 'docker' commands used in the AWS docs to get them to work here. For example, where the 'Getting Started' guide uses a command such as this:

```
docker exec cli peer channel fetch config \ 
/opt/home/channel-artifacts/ourchannelCfg.pb \
-c ourchannel -o $ORDERER \
--cafile /opt/home/managedblockchain-tls-chain.pem --tls
```

you will need to supplement this with additional environment variables:

```
docker exec -e "CORE_PEER_TLS_ENABLED=true" -e "CORE_PEER_TLS_ROOTCERT_FILE=/opt/home/managedblockchain-tls-chain.pem" \
    -e "CORE_PEER_ADDRESS=$PEER" -e "CORE_PEER_LOCALMSPID=$MSP" -e "CORE_PEER_MSPCONFIGPATH=$MSP_PATH" \
    cli peer channel fetch config \
    /opt/home/channel-artifacts/ourchannelCfg.pb \
    -c ourchannel -o $ORDERER \
    --cafile /opt/home/managedblockchain-tls-chain.pem --tls
```

Supplementing the 'docker' commands is not required for 'configtxlator'.

On the Fabric client node.

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
they are not, follow step 4 in [Part 1](../ngo-fabric/README.md) to repopulate them.

```
cd ~/non-profit-blockchain/ngo-fabric
source fabric-exports.sh
source ~/peer-exports.sh 
```

Install Node.js. You may have already done this if you are running the REST API on the Fabric client node. However, the versions of Node.js supported by Hyperledger Explorer may differ from the one you installed earlier: 

We will use Node.js v12.x.

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.3/install.sh | bash
```

```
. ~/.nvm/nvm.sh
nvm install 12
nvm use 12
```

Amazon Linux seems to be missing g++, so:

```
sudo yum install gcc-c++ -y
```

Install jq and PostgreSQL. We only really need the PostgreSQL client, but I install everything just in case I miss a dependency:

```
sudo yum install -y jq
sudo yum install -y postgresql postgresql-server postgresql-devel postgresql-contrib postgresql-docs
```

## Step 1 - Clone the appropriate version of the Hyperledger Explorer repository

On the Fabric client node.

The GitHub repo for Hyperledger Explorer is here:

https://github.com/hyperledger/blockchain-explorer

Clone it:

```
cd ~
git clone https://github.com/hyperledger/blockchain-explorer
```

You want to check out the tag aligned to the version of Hyperledger Fabric you are using. You can confirm the appropriate tag from the information in the [README](https://github.com/hyperledger/blockchain-explorer#release-notes).

```
cd ~/blockchain-explorer
git checkout tags/v1.1.2
git status
```

## Step 2 - Create the Amazon RDS PostgreSQL instance used by Hyperledger Explorer

We will use CloudFormation to create our PostgreSQL RDS instance. We want the RDS instance in the same VPC as the Fabric client node.

```
cd ~/non-profit-blockchain/blockchain-explorer
./hyperledger-explorer-rds.sh
```

## Step 3 - Create the Hyperledger Explorer database tables in the PostgreSQL RDS database

Once step 2 has completed and your PostgreSQL instance is running, you will create tables in a PostgreSQL database. These tables are used by Hyperledger Explorer to store details of your Fabric network. Before running the script to create the tables, update the Hyperledger Explorer table creation script. The columns created by the script are too small to contain the long peer names used by Managed Blockchain, so we edit the script to increase the length:

```
sed -i "s/varchar(64)/varchar(256)/g" ~/blockchain-explorer/app/persistence/fabric/postgreSQL/db/explorerpg.sql
```

Update the Hyperledger Explorer database connection config with the Amazon RDS connection details. We will do this automatically below, but if you'd like to do it manually, you'll need to replace the host, username and password with those you used when you created your PostgreSQL instance. These values can be obtained from the following:

* host: from the CloudFormation stack you created in step 2. See the output field: RDSHost, in the CloudFormation console.
* username & password: you either passed these into the creation of the stack in step 2, or you used the defaults. See the default values in hyperledger-explorer-cfn.yaml.

Let's update the config automatically using the statements below. We will query the CloudFormation stack to obtain the RDS endpoint, then replace this in the config file:

```
export REGION=us-east-1
export FABRICSTACK=$NETWORKNAME-hyperledger-explorer-rds
export RDSHOST=$(aws cloudformation --region $REGION describe-stacks --stack-name $FABRICSTACK --query "Stacks[0].Outputs[?OutputKey=='RDSHost'].OutputValue" --output text)
cp ~/non-profit-blockchain/blockchain-explorer/explorerconfig.json ~/blockchain-explorer/app/explorerconfig.json
sed -i "s|%RDSHOST%|$RDSHOST|g" ~/blockchain-explorer/app/explorerconfig.json
cat ~/blockchain-explorer/app/explorerconfig.json
```

Replace the contents of the table creation script:

```
cp ~/non-profit-blockchain/blockchain-explorer/createdb.sh ~/blockchain-explorer/app/persistence/fabric/postgreSQL/db/createdb.sh
```

Now create the database tables. You will need to enter the password for the 'master' user. The password can be found in  'explorerconfig.json', the file we updated a minute ago; it will also be printed out for you when you execute the command below. You will need to enter this password for two different steps, and you'll need to type it, not copy and paste:

```
cd ~/blockchain-explorer/app/persistence/fabric/postgreSQL/db
./createdb.sh
```

If you need to connect to psql via the command line, use this (replacing the RDS DNS with your own):

```
psql -X -h sd1erq6vwko24hx.ce2rsaaq7nas.us-east-1.rds.amazonaws.com -d fabricexplorer --username=master 
```

## Step 4 - Create a connection profile to connect Hyperledger Explorer to Amazon Managed Blockchain

Hyperledger Explorer uses a connection profile to connect to the Fabric network. If you have worked through Part 3 of this series you will have used connection profiles to connect the REST API to the Fabric network. As in part 3, I generate the connection profile here automatically, based on the ENV variables you populated in the pre-requisites section above (when you sourced fabric-exports.sh). The connection profile does assume that the MSP directory containing the keys and certificates is /home/ec2-user/admin-msp. If you are using a different directory you will need to update the connection profile.

Fabric uses a discovery service to discover details of the Fabric network, and Explorer depends on this to reflect the network in the dashboard. The connection profile only needs to connect to one peer in order to discover the state of the network via the Gossip protocol. However, take note of the following information, copied from the pre-requisites section:

* If you have multiple peer nodes for your member, the Fabric discovery service will discover them and display them in the Explorer dashboard.

* If you have a multi-member Fabric network, you must configure anchor peers for the member(s), otherwise the Fabric discovery service will be unable to discover peers belonging to other members. See the pre-requisites section at the top of this page for more details.

```
cd ~/non-profit-blockchain/blockchain-explorer/connection-profile
./gen-connection-profile.sh
more ~/blockchain-explorer/app/platform/fabric/amb-network.json
```

One difference between the connection profile used by Hyperledger Explorer compared to the profile used by the REST API, is that Hyperledger Explorer expects the peer name in the profile to be the full name of the peer, such as 'nd-mj2vophcizasdg5ssehagqe3n4.m-733fj7siwjavhmyj5z273dz7te.n-erwbh4ou2bhbzfbgnepspy3u5m.managedblockchain.us-east-1.amazonaws.com'. It's not just an ID that you choose. If you do not use the matching peer name you may see an error message when starting the Explorer, that looks like this: 'ReferenceError: host_port is not defined'

Now build Hyperledger Explorer:

```
nvm use 12
cd ~/blockchain-explorer
./main.sh install
```

## Step 5 - Run Hyperledger Explorer and view the dashboard

Run Hyperledger Explorer.

NOTE: depending on the version of Hyperledger Explorer you are using, you might need to use the ENV variable exported below (export DISCOVERY_AS_LOCALHOST=false), otherwise explorer uses the discovery service and assumes that all your Fabric components are being run in docker containers on localhost. 

```
nvm use 12
cd ~/blockchain-explorer/
export DISCOVERY_AS_LOCALHOST=false
./start.sh
```

The Hyperledger Explorer client starts on port 8080. You may see some warnings and errors appearing in the console, such as those related to [this issue](https://jira.hyperledger.org/browse/BE-797).

You already have an ELB that routes traffic to port 8080. The ELB was created for you by the AWS CloudFormation template in step 2. Once the health checks on the ELB succeed, you can access the Hyperledger Explorer client using the DNS of the ELB. You can find the ELB endpoint using the key `BlockchainExplorerELBDNS` in the outputs tab of the CloudFormation stack.

If you are unable to access the Explorer dashboard, check the logs. Logs can be found in these locations in the blockchain-explorer repo folder, `~/blockchain-explorer/`:

* ./logs/console folder to view the logs relating to console
* ./logs/app to view the application logs
* ./logs/db to view the database logs

To stop Hyperledger Explorer:

```
cd ~/blockchain-explorer/
./stop.sh
```

## Step 6 - Use the Swagger Open API Specification UI to interact with Hyperledger Explorer
Hyperledger Explorer provides a RESTful API that you can use to interact with the Fabric network. Appending ‘api-docs’ to the same ELB endpoint you used in step 5 will display the Swagger home page for the API.

For example:

http://ngo-hyper-Blockcha-1O59LKQ979CAF-726033826.us-east-1.elb.amazonaws.com/api-docs

To use Swagger for live testing of the API, you will need to update the host property in swagger.json, pointing to your ELB DNS:

```
vi ~/blockchain-explorer/swagger.json
```

Update the 'servers' property, using the same ELB DNS as in step 5. Make sure you remove the port 8080 from the URL:

```
{
        "openapi": "3.0.1",
        "info": {
                "title": "Hyperledger Explorer REST API Swagger",
                "description": "Rest API for fabric",
                "termsOfService": "http://swagger.io/terms/",
                "contact": {
                        "name": "Hyperledger Team"
                },
                "license": {
                        "name": "Apache 2.0",
                        "url": "http://www.apache.org/licenses/LICENSE-2.0.html"
                },
                "version": "1.0.0"
        },
        "servers": [
                {
                        "url": "http://ngo-hyper-Blockcha-1O59LKQ979CAF-726033826.us-east-1.elb.amazonaws.com"
                },
                {
                        "url": "https://ngo-hyper-Blockcha-1O59LKQ979CAF-726033826.us-east-1.elb.amazonaws.com"
                }
        ],
```

After updating the file, restart Hyperledger Explorer, then navigate to the Swagger URL.

*If the Swagger UI is still pointing to localhost after you update swagger.json, you may need to clear your browser cache*

You will need to authenticate before using the API. In the Swagger UI, select `/auth/login` and then 'Try it out'. Enter the payload below (this assumes you are using the default username/password for Hyperledger Explorer)

```
{
  "user": "exploreradmin",
  "password": "exploreradminpw",
  "network": "amb-network"
}
```

After clicking 'Execute', you should see a response similar to this:

```
{
  "success": true,
  "message": "You have successfully logged in!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZXhwbG9yZXJhZG1pbiIsIm5ldHdvcmsiOiJhbWItbmV0d29yayIsImlhdCI6MTU5Nzk5ODYxNSwiZXhwIjoxNTk4MDA1ODE1fQ.SWwNpvTM8TddaqW6tPVzpRSvow-iVJiRBtLplykfzjU",
  "user": {
    "message": "logged in",
    "name": "exploreradmin"
  }
}
```

Copy the value of 'token', then click the 'Authorize' link at the top of the Swagger UI. Enter the token into the 'bearer' field and authorize. Once authorized you'll be able to interact with the API.

You now have Hyperledger Explorer running and are able to use this to view the configuration and activity in your Fabric network. You also have access to the Explorer REST API.   

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../ngo-chaincode/README.md) Deploy the non-profit chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the RESTful API server. 
* [Part 4:](../ngo-ui/README.md) Run the application. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 
* [Part 6:](../ngo-lambda/README.md) Read and write to the blockchain with Amazon API Gateway and AWS Lambda.
* [Part 7:](../ngo-events/README.md) Use blockchain events to notify users of NGO donations.
* [Part 8:](../blockchain-explorer/README.md) Deploy Hyperledger Explorer. 

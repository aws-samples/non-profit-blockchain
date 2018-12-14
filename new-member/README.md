# Part 5: Adding a new member to an existing channel

Part 5 will help you to add a new member running in a different AWS Account to the Fabric network you created in [Part 1](../ngo-fabric/README.md). After adding the new member you will create a peer node for the member and join the peer
node to the channel created in [Part 1](../ngo-fabric/README.md). The new peer node will receive the blocks that exist
on the next channel and will build its own copy of the ledger. We will also configure the Fabric network so the new
member can take part in endorsing transactions.

Adding a new member to an existing Fabric network involves a number of steps. The new member is located in a different AWS account, and the steps therefore involve cooperation between administrators for the Fabric member in the existing account (let’s call this Account A), and the new account (let’s call this Account B). The steps look as follows:

1.	Account A invites Account B to join the Fabric network
2.	Account B creates a member in the Fabric network
3.	Account B creates a peer node
4.	Account B shares the public keys for its member with Account A
5.	Account A updates the channel configuration with the MSP for Account B
6.	Account A shares the genesis block for the channel with Account B
7.	Account B starts its peer node and joins the channel
8.	If Account B will take part in endorsing transaction proposals, Account B will install chaincode

## Pre-requisites - Account A, the network creator
There are multiple parts to the workshop. Before starting on Part 5, a network creator should haved completed [Part 1](../ngo-fabric/README.md). You need an existing Fabric network before starting Part 5. The network creator would have also created a peer node under a member belonging to Account A.

## Pre-requisites - Account B
We will use Cloud9 to provide a Linux terminal which has the AWS CLI already installed.

1. Spin up a [Cloud9 IDE](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1) from the AWS console.
In the Cloud9 console, click 'Create Environment'. Using 'us-east-1' for the region will be easier.
2. Provide a name for your environment, e.g. fabric-c9, and click **Next Step**
3. Select `Other instance type`, then select `t2-medium` and click **Next Step**
4. Click **Create environment**. It would typically take 30-60s to create your Cloud9 IDE
5. In the Cloud9 terminal, in the home directory, clone this repo:

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

Download the model file for the new Amazon Managed Blockchain service. This is a temporary step
and will not be required once the `managedblockchain` service has been included in the latest CLI.

```
cd ~
aws s3 cp s3://managedblockchain-beta/service-2.json .  
aws configure add-model --service-model file://service-2.json --service-name managedblockchain
```

## Step 1: Account A invites Account B to join the Fabric network
In the Amazon Managed Blockchain Console: https://console.aws.amazon.com/managedblockchain

The admin user for Account A invites another AWS account to join the Fabric network. In the Amazon Managed Blockchain console, select your network and click the ‘Invite account’ button. Enter the 12-digit AWS account number. You should see a confirmation message indicating your invitation has been sent successfully.

## Step 2: Account B creates a member in the Fabric network
In the Amazon Managed Blockchain Console: https://console.aws.amazon.com/managedblockchain

The admin user for Account B can view the invitation in the Amazon Managed Blockchain console. Clicking on the network name will show the details of the network that Account B has been invited to join. Click ‘Create member’ to create a member in the network, entering a unique member name and an administrator username and password for the member. Note down the admin username and password.

## Step 3: Account B creates a peer node
In the Amazon Managed Blockchain Console: https://console.aws.amazon.com/managedblockchain

Once the Fabric network and member for Account B have an ACTIVE status, it’s time to create a Fabric peer node. Each member on a network creates their own peer nodes, so select the member you created above and click the link to create a peer node. Select an instance type, the amount of storage for that node, and create the peer node.

## Step 4: Account B creates a Fabric client node
These steps are identical to those performed by Account A when the Fabric network was originally created. See Step 3 in [Part 1:](../ngo-fabric/README.md). The steps have been replicated below.

In your Cloud9 terminal window.

Create the Fabric client node, which will host the Fabric CLI. You will use the CLI to administer
the Fabric network. The Fabric client node will be created in its own VPC, with VPC endpoints 
pointing to the Fabric network created by the network creator in [Part 1](../ngo-fabric/README.md). 
CloudFormation will be used to create the Fabric client node, the VPC and the VPC endpoints.

The CloudFormation template requires a number of parameter values. We'll make sure these 
are available as export variables before running the script below. You can obtain these values
from the Amazon Managed Blockchain Console.

In Cloud9:

```
export REGION=us-east-1
export NETWORKID=<the network ID created by the network creator, from the Amazon Managed Blockchain Console>
export NETWORKNAME=<the name of the network>
```

Set the VPC endpoint. Make sure it has been populated and exported. If the `echo` statement below shows
that it's blank, check the details under your network in the Amazon Managed Blockchain Console: 

```
export VPCENDPOINTSERVICENAME=$(aws managedblockchain get-network --region $REGION --network-id $NETWORKID --query 'Network.VpcEndpointServiceName' --output text)
echo $VPCENDPOINTSERVICENAME
```

If the VPC endpoint is populated with a value, go ahead and run this script. This will create the
CloudFormation stack. You will see an error saying `Keypair not found`. This is expected as the script
will check whether the keypair exists before creating it. I don't want to overwrite any existing
keypairs you have, so just ignore this error and let the script continue:

```
cd ~/non-profit-blockchain/ngo-fabric
./3-vpc-client-node.sh
```

Check the progress in the AWS CloudFormation console and wait until the stack is CREATE COMPLETE.
You will find some useful information in the Outputs tab of the CloudFormation stack once the stack
is complete. We will use this information in later steps.

## Step 4 - Account B prepares the Fabric client node and enrolls an identity
On the Fabric client node.

Prior to executing any commands in the Fabric client node, you will need to export ENV variables
that provide a context to Hyperledger Fabric. These variables will tell the client node which peer
node to interact with, which TLS certs to use, etc. 

From Cloud9, SSH into the Fabric client node. The key (i.e. the .PEM file) should be in your home directory. 
The DNS of the Fabric client node EC2 instance can be found in the output of the CloudFormation stack you 
created in Step 3 above.

Answer 'yes' if prompted: `Are you sure you want to continue connecting (yes/no)`

```
cd ~
ssh ec2-user@<dns of EC2 instance> -i ~/<Fabric network name>-keypair.pem
```

Clone the repo:

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

Create the file that includes the ENV export values that define your Fabric network configuration.

```
cd ~/non-profit-blockchain/ngo-fabric
cp templates/exports-template.sh fabric-exports.sh
vi fabric-exports.sh
```

Update the export statements at the top of the file. The info you need can be found 
in the Amazon Managed Blockchain Console, under your network. The member details you use, and 
the admin username and password, are the ones you entered when creating your member.

Source the file, so the exports are applied to your current session. If you exit the SSH 
session and re-connect, you'll need to source the file again.

```
cd ~/non-profit-blockchain/ngo-fabric
source fabric-exports.sh
```

Sourcing the file will do two things:
* export the necessary ENV variables
* create another file which contains the export values you need to use when working with a Fabric peer node.
This can be found in the file: `~/peer-exports.sh`. You will see how to use this in a later step.

Check the `source` worked:

```
$ echo $PEERSERVICEENDPOINT
nd-4MHB4EKFCRF7VBHXZE2ZU4F6GY.m-B7YYBFY4GREBZLPCO2SUS4GP3I.n-WDG36TTUD5HEJORZUPF4REKMBI.managedblockchain.us-east-1.amazonaws.com:30003
```

Check the peer export file exists and that it contains a number of export keys with values:

```
cat ~/peer-exports.sh 
```

If the file has values for all keys, source it:

```
source ~/peer-exports.sh 
```

Enroll an admin identity with the Fabric CA (certificate authority). We will use this
identity to administer the Fabric network and perform tasks such as creating channels
and instantiating chaincode.

```
export PATH=$PATH:/home/ec2-user/go/src/github.com/hyperledger/fabric-ca/bin
cd ~
fabric-ca-client enroll -u https://$ADMINUSER:$ADMINPWD@$CASERVICEENDPOINT --tls.certfiles /home/ec2-user/managedblockchain-tls-chain.pem -M /home/ec2-user/admin-msp 
```

Some final copying of the certificates is necessary:

```
mkdir -p /home/ec2-user/admin-msp/admincerts
cp ~/admin-msp/signcerts/* ~/admin-msp/admincerts/
cd ~/non-profit-blockchain/ngo-fabric
```

## Step 5: Account B shares the public keys for its member with Account A
On the Fabric client node in Account B.

Account B needs to share two certificates with Account A:

* the admin cert, stored in /home/ec2-user/admin-msp/admincerts
* the root CA cert, store in /home/ec2-user/admin-msp/cacerts 

Information will be shared via S3. Account B will copy the certs to S3, and Account A will fetch them from S3.

Update the region and member ID in the following script. The member ID is the ID of the new member in Account B:

```
cd ~/non-profit-blockchain
vi new-member/s3-handler.sh 
```

Copy the Account B public keys to S3:

```bash
cd ~/non-profit-blockchain
./new-member/s3-handler.sh createS3BucketForNewMember
./new-member/s3-handler.sh copyCertsToS3
```

## Step 6: Account A creates an MSP for the new Account A member 
On the Fabric client node in Account A.

Account A stores the certificates provided by Account B on its Fabric client node.

Update the region and member ID in the following script. The member ID is the ID of the new member in Account B, so this 
file should look identical to the one created in the previous step:

```
cd ~/non-profit-blockchain
vi new-member/s3-handler.sh 
```

Copy the Account B public keys from S3 to the MSP directory on the Fabric client node in Account A:

```bash
cd ~/non-profit-blockchain
./new-member/s3-handler.sh copyCertsFromS3
```


## Step 7: Account A updates the channel configuration with the MSP for Account B
This step generates a new channel configuration block that includes the new member belonging to Account B. A configuration block is similar to the genesis block, defining the members and policies for a channel. In fact, you can consider a configuration block to be the genesis block plus the delta of configuration changes that have occurred since the channel was created. 

A new channel configuration block is created by fetching the latest configuration block from the channel, generating a new channel configuration, then comparing the old and new configurations to generate a 'diff'. 

## Step 8: Endorsing peers must sign the new channel configuration
The 'diff' must be signed by the existing network members, i.e. the network members must endorse the changes to the channel configuration and approve the new member joining the channel. A channel configuration update is really just another transaction in Fabric, known as a 'configuration transaction', and as such it must be endorsed by network members in accordance with the modification policy for the channel. The default modification policy for the channel Application group is MAJORITY, which means a majority of members need to sign the channel configuration update.

To allow admins belonging to different members to sign the channel configuration you will need to pass the channel configuration ‘diff’ file to each member in the network, one-by-one, and have them sign the channel configuration. Each member signature must be applied in turn so that we end up with a package that has the signatures of all endorsing members. Alternatively, you could send the channel config to all members simultaneously and wait to receive signed responses, but then you would have to extract the signatures from the individual responses and create a single package which contains the configuration update plus all the required signatures.

At this point you may only have two members: the member owned by the network creator, and the new member. In this case, only the member owned by the network creator needs to sign the package. However, I have made this step explicit because you will need to 
include this step as more members join the network.

Once we have a signed channel configuration we can apply it to the channel.

## Step 9: Account A updates the channel with the new configuration
In this step we update the channel with the new channel configuration. Since the new channel configuration now includes details
of the new organisation, this will allow the new organisation to join the channel.

## Step 10: Account A shares the genesis block for the channel with Account B
Before the peer node in Account B joins the channel, it must be able to connect to the Ordering Service managed by Amazon Managed Blockchain. It obtains the Ordering Service endpoint from the channel genesis block. The file mychannel.block ('mychannel' refers to the channel name and may differ if you have changed the channel name) would have been created when you first created the channel. Make sure the mychannel.block file is available to the peer node in Account B.

## Step 11: Account B starts its peer node and joins the channel
The next step is to join the peer node to the channel. After the peer successfully joins the channel it will start receiving blocks of transactions and build its own copy of the ledger, creating the blockchain and populating the world state key-value store.

## Step 12: Account B installs chaincode
After install the chaincode, the peer node in Account B will be able to run queries and endorse transactions.

## Step 13: Account B queries chaincode and invokes transactions
To check that the new member owned by Account B is a full member of the Fabric network, the peer node will execute queries against its own ledger and invoke transactions on the network. Since the new member is included in the endorsement policy we expect to this transactions endorsed by the new member.

## The workshop sections
The workshop instructions can be found in the README files in parts 1-4:

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Amazon Managed Blockchain Hyperledger Fabric network.
* [Part 2:](../ngo-chaincode/README.md) Deploy the NGO chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the REST API. 
* [Part 4:](../ngo-ui/README.md) Run the Application. 

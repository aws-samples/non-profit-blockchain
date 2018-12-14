# Part 5: Adding a new member to an existing channel

Part 5 will help you to add a new member running in a different AWS Account to the Fabric network you created in [Part 1](../ngo-fabric/README.md). After adding the new member you will create a peer node for the member and join the peer
node to the channel created in [Part 1](../ngo-fabric/README.md). The new peer node will receive the blocks that exist
on the next channel and will build its own copy of the ledger. We will also configure the Fabric network so the new
member can take part in endorsing transactions.

## Pre-requisites
There are multiple parts to the workshop. Before starting on Part 5 you should at least complete [Part 1](../ngo-fabric/README.md). You need an existing Fabric network in order to create a new member.



## The workshop sections
The workshop instructions can be found in the README files in parts 1-4:

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the AWS Managed Blockchain Hyperledger Fabric network.
* [Part 2:](../ngo-chaincode/README.md) Deploy the NGO chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the REST API. 
* [Part 4:](../ngo-ui/README.md) Run the Application. 

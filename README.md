# Amazon Managed Blockchain Workshop

![Amazon Managed Blockchain](images/AmazonManagedBlockchain.png "Amazon Managed Blockchain")

> Updated to support Fabric v1.4x

## Building and deploying an application for Hyperledger Fabric on Amazon Managed Blockchain

This workshop builds a Hyperledger Fabric blockchain network using Amazon Managed Blockchain. Once the Fabric network has been created, you will deploy a 3-tier application that uses the Fabric network to track donations to a non-profit organisation, and track how those donations are spent by the non-profit. Donations 
and spending are tracked on a Hyperledger Fabric blockchain network with both donors and non-profits 
(NGO's) being members of the network. The 3-tier application consists of the following components:

* Node.js / Angular user interface application, accessing services provided by a RESTful API
* RESTful API, running as a Node.js Express application, using the Hyperledger Fabric Client SDK to query 
and invoke chaincode
* Fabric Chaincode, written in Node.js, deployed to a Hyperledger Fabric network

This workshop will build a Hyperledger Fabric blockchain network using Amazon Managed Blockchain, deploy the chaincode,
start the RESTful API server and finally run a UI application that uses the RESTful API to interact with the Fabric
network. The workshop is divided into four parts:

1. Building a Hyperledger Fabric blockchain network using Amazon Managed Blockchain. Instructions can be found in the folder: [ngo-fabric](ngo-fabric)
2. Deploying the chaincode, or smart contract, that provides the donation and spend tracking functionality. Instructions can be found in the folder: [ngo-chaincode](ngo-chaincode)
3. Starting the RESTful API server that exposes the chaincode functions to client applications. Instructions can be found in the folder: [ngo-rest-api](ngo-rest-api)
4. Running the User Interface application. Instructions can be found in the folder: [ngo-ui](ngo-ui)

## Getting started

To build the network, deploy the chaincode, start the RESTful API server and run the application, follow the 
README instructions in parts 1-4, in this order:

* [Part 1:](ngo-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](ngo-chaincode/README.md) Deploy the non-profit chaincode. 
* [Part 3:](ngo-rest-api/README.md) Run the RESTful API server. 
* [Part 4:](ngo-ui/README.md) Run the application. 
* [Part 5:](new-member/README.md) Add a new member to the network. 
* [Part 6:](ngo-lambda/README.md) Read and write to the blockchain with Amazon API Gateway and AWS Lambda.
* [Part 7:](ngo-events/README.md) Use blockchain events to notify users of NGO donations.
* [Part 8:](blockchain-explorer/README.md) Deploy Hyperledger Explorer. 
* [Part 9:](../ngo-identity/README.md) Integrating blockchain users with Amazon Cognito.

## Cleanup

To clean up your resources delete the Hyperledger Fabric network managed by Amazon Managed Blockchain and the AWS CloudFormation template as follows:

* In the AWS CloudFormation console delete the stack with the stack name `<your network>-fabric-client-node`
* In the Amazon Managed Blockchain console delete the member for your network. This will delete the peer node, the member, and finally, the Fabric network (assuming you created only one member)
* In the AWS Cloud9 console delete your AWS Cloud9 instance

## License

This library is licensed under the Apache 2.0 License. 

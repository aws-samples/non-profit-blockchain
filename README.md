# AWS Blockchain Workshop
## Building a blockchain application to support donations and spend tracking for a 
## non-profit organisation using Hyperledger Fabric

Builds a Hyperledger Fabric blockchain network, a REST API and a User Interface application to 
track donations and spend for non-profit organizations. Donors are able to track the donations
they make and how how their donations are being spent. Donations and spending are tracked 
on a Hyperledger Fabric blockchain network with both donors and NGO's (non profits) being members of
the network. The application is 3-tier and consists of:

* Node.js / Angular user interface, accessing services provided by a REST API
* REST API, running as a Node.js Express application, using the Hyperledger Fabric SDK to query 
and invoke chaincode
* Fabric Chaincode, written in Node.js

This workshop will build an AWS Managed Blockchain Hyperledger Fabric network, deploy the chaincode,
start the REST API and finally run an application that uses the REST API to interact with the Fabric
network. The workshop is divided into four parts:

1. AWS Managed Blockchain Hyperledger Fabric network. This can be found in the folder: ngo-fabric
2. The chaincode, or smart contract, that provides the donation and spend tracking functionality. This can be found in the folder: ngo-chaincode
3. The REST API server that exposes the chaincode functions to client applications. This can be found in the folder: ngo-rest-api
4. The User Interface application. This can be found in the foder: ngo-ui

## Getting started
Follow the README instructions in parts 1-4 in order:

* Part 1: Start the workshop by building the AWS Managed Blockchain Hyperledger Fabric network. Instructions 
can be found in the README under ngo-fabric.
* Part 2: Deploy the NGO chaincode. Instructions can be found in the README under ngo-chaincode.
* Part 3: Run the REST API. Instructions can be found in the README under ngo-rest-api.
* Part 4: Run the Application. Instructions can be found in the README under ngo-ui.

## License

This library is licensed under the Apache 2.0 License. 

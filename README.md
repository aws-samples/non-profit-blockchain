# AWS Managed Blockchain Workshop

## Building a network to track spending by non-profit organisations

This workshop builds an AWS Managed Blockchain Hyperledger Fabric network, a RESTful API and a 
User Interface application that tracks donations and spend for non-profit organizations. Donors 
are able to track the donations they make and how how their donations are being spent. Donations 
and spending are tracked on a Hyperledger Fabric blockchain network with both donors and non-profits 
(NGO's) being members of the network. The application is 3-tier and consists of:

* Node.js / Angular user interface application, accessing services provided by a RESTful API
* REST API, running as a Node.js Express application, using the Hyperledger Fabric SDK to query 
and invoke chaincode
* Fabric Chaincode, written in Node.js, deployed to a Hyperledger Fabric network

This workshop will build an AWS Managed Blockchain Hyperledger Fabric network, deploy the chaincode,
start the REST API and finally run an application that uses the REST API to interact with the Fabric
network. The workshop is divided into four parts:

1. AWS Managed Blockchain Hyperledger Fabric network. This can be found in the folder: [ngo-fabric](ngo-fabric)
2. The chaincode, or smart contract, that provides the donation and spend tracking functionality. This can be found in the folder: [ngo-chaincode](ngo-chaincode)
3. The REST API server that exposes the chaincode functions to client applications. This can be found in the folder: [ngo-rest-api](ngo-rest-api)
4. The User Interface application. This can be found in the foder: [ngo-ui](ngo-ui)

## Getting started
To build the network, deploy the chaincode, start the REST API server and run the application, follow the 
README instructions in parts 1-4, in order:

* [Part 1:](ngo-fabric/README.md) Start the workshop by building the AWS Managed Blockchain Hyperledger Fabric network.
* [Part 2:](ngo-chaincode/README.md) Deploy the NGO chaincode. Instructions can be found in the README under ngo-chaincode.
* [Part 3:](ngo-rest-api/README.md) Run the REST API. Instructions can be found in the README under ngo-rest-api.
* [Part 4:](ngo-ui/README.md) Run the Application. Instructions can be found in the README under ngo-ui.

## License

This library is licensed under the Apache 2.0 License. 

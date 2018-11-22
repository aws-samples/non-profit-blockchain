# AWS Managed Blockchain Workshop

## Building a network to track spending by non-profit organizations

This workshop builds an AWS Managed Blockchain Hyperledger Fabric network, a RESTful API and a 
User Interface application that tracks donations and spend for non-profit organizations. Donors 
are able to track the donations they make and how how their donations are being spent. Donations 
and spending are tracked on a Hyperledger Fabric blockchain network with both donors and non-profits 
(NGO's) being members of the network. The application is 3-tier and consists of a:

* Node.js / Angular user interface application, accessing services provided by a RESTful API
* REST API, running as a Node.js Express application, using the Hyperledger Fabric SDK to query 
and invoke chaincode
* Fabric Chaincode, written in Node.js, deployed to a Hyperledger Fabric network

This workshop will build an AWS Managed Blockchain Hyperledger Fabric network, deploy the chaincode,
start the REST API server and finally run a UI application that uses the REST API to interact with the Fabric
network. The workshop is divided into four parts:

1. Building an AWS Managed Blockchain Hyperledger Fabric network. Instructions can be found in the folder: [ngo-fabric](ngo-fabric)
2. Deploying the chaincode, or smart contract, that provides the donation and spend tracking functionality. Instructions can be found in the folder: [ngo-chaincode](ngo-chaincode)
3. Starting the RESTful API server that exposes the chaincode functions to client applications. Instructions can be found in the folder: [ngo-rest-api](ngo-rest-api)
4. Running the User Interface application. Instructions can be found in the folder: [ngo-ui](ngo-ui)

## Getting started
To build the network, deploy the chaincode, start the RESTful API server and run the application, follow the 
README instructions in parts 1-4, in this order:

* [Part 1:](ngo-fabric/README.md) Start the workshop by building the AWS Managed Blockchain Hyperledger Fabric network.
* [Part 2:](ngo-chaincode/README.md) Deploy the NGO chaincode. 
* [Part 3:](ngo-rest-api/README.md) Run the REST API. 
* [Part 4:](ngo-ui/README.md) Run the Application. 

## License

This library is licensed under the Apache 2.0 License. 

# REST API to expose the Chaincode

The REST API is a Node.js application that uses the Fabric SDK to interact with the Fabric chaincode
and exposes the chaincode functions as REST APIs. This allows separate between the UI application
and the underlying Fabric chaincode.

## Generate a connection profile

The REST API needs a connection profile to connect to the Fabric network. The instructions below will create
the connection profile for the first-network provided by fabric-samples. To create the connection profile do the 
following:

* Edit the script ngo-rest-api/connection-profile/gen-connection-profile.sh. 
* Update the REPODIR to point to the directory where this ngo-blockchain repo has been cloned.
* Update the CERTDIR to point to the directory where the fabric-samples has been cloned, if this is where your crypto information resides.
* Run the script

```
cd ngo-rest-api/connection-profile
./gen-connection-profile.sh
```

This will generate the profiles and list the directory that stores them, for example:

```
ls -lR /Users/edgema/Documents/apps/ngo-blockchain/tmp/connection-profile/
```

## Run the REST API Node.js application

Edit the file config.json and update the `admins` entry to contain the admin username and password for your org's Fabric CA.

Then install the dependencies:

```
npm install
```

Then run the app (in the background if you prefer):

```
node app.js &
```

## REST API 
Once the app is running you can register an identity, and then start to execute chaincode

### Register/enroll a user:

curl -s -X POST http://localhost:3000/users -H "content-type: application/x-www-form-urlencoded" -d 'username=michael&orgName=Org1'

### Get channel

curl -s -X GET   "http://localhost:3000/channels/mychannel"  -H "content-type: application/json"

### Get all donor

request:
curl -s -X GET   "http://localhost:3000/donor" -H "content-type: application/json"

response:
[
    {"docType":"donor","donorUserName":"braendle","email":"braendle@abc.com","registeredDate":"2018-10-26"},
    {"docType":"donor","donorUserName":"edge","email":"edge@abc.com","registeredDate":"2018-10-25"}
]

### Get specific donor

request:
curl -s -X GET   "http://localhost:3000/donor/edge" -H "content-type: application/json"

response:
[
    {"docType":"donor","donorUserName":"braendle","email":"braendle@abc.com","registeredDate":"2018-10-26"},
    {"docType":"donor","donorUserName":"edge","email":"edge@abc.com","registeredDate":"2018-10-25"}
]

### POST Donor

request:
curl -s -X POST "http://localhost:3000/donor" -H "content-type: application/json" -d '{ 
   "donorUserName": "abc", 
   "email": "abc@def.com", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}'

response:


# Troubleshooting

Error: [2018-11-06T11:44:51.485] [ERROR] Helper - ##### getRegisteredUser - Failed to get registered user: michael with error: TypeError: Cannot read property 'curve' of undefined

Solution: make sure the certificate stores are removed before starting the REST api. Using `./start.sh` will remove these. The 
error is caused by using the wrong certificate - probably an old one from the cert store.
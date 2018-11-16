# REST API to expose the Chaincode

The REST API is a Node.js application that uses the Fabric SDK to interact with the Fabric chaincode
and exposes the chaincode functions as REST APIs. This allows separate between the UI application
and the underlying Fabric chaincode.

## Running on an EC2 instance
### Install Node
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

### Clone the repo

```
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

### Npm install

```
cd non-profit-blockchain
npm install
```


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

### Get all NGOs

request:
curl -s -X GET http://localhost:3000/ngo -H 'content-type: application/json'

response:
[
    {"address":"1 Pet street","contactEmail":"pets@petco.com","contactNumber":"82372837","docType":"ngo","ngoDescription":"We help pets in need","ngoName":"Pets In Need","ngoRegistrationNumber":"12e4eed4-d36b-47b2-a6f4-bcd8232840c3"},
    {"address":"1 Pet street","contactEmail":"pets@petco.com","contactNumber":"82372837","docType":"ngo","ngoDescription":"We help pets in need","ngoName":"Pets In Need","ngoRegistrationNumber":"144792c3-12b8-4c52-9a88-f452b622056b"}
]

### Get all Donations

request:
curl -s -X GET http://localhost:3000/donation -H 'content-type: application/json'

response:
[
    {"docType":"donation","donationAmount":1,"donationDate":"2018-09-20T12:41:59.582Z","donationId":"02e12ade-53b5-4675-ad66-80c23d382166","donor":"edge","ngo":"ccaa63aa-e1fd-4e82-a7a7-35ecb8615a7c"},{"docType":"donation","donationAmount":222,"donationDate":"2018-09-20T12:41:59.582Z","donationId":"0d23f3e6-df32-4f8c-8bb7-74d3f71d27c6","donor":"edge","ngo":"940e6579-dbb4-4bdc-b4fe-36c8ded32c69"},{"docType":"donation","donationAmount":0,"donationDate":"2018-09-20T12:41:59.582Z","donationId":"e9be9782-f70b-481f-99e2-73072b5f292b","donor":"edge","ngo":"940e6579-dbb4-4bdc-b4fe-36c8ded32c69"}
]

### Get all Spends

request:
curl -s -X GET http://localhost:3000/spend -H 'content-type: application/json'

response:
[
    {"docType":"spend","ngo":"8cc9bb82-523e-4714-bd96-a742cb2a70b9","spendAmount":444,"spendDate":"2018-09-20T12:41:59.582Z","spendDescription":"Peter Pipers Poulty Portions for Pets","spendId":"02471ce0-b141-4699-8b1b-2195e8ef4dd4"},{"docType":"spend","ngo":"ccaa63aa-e1fd-4e82-a7a7-35ecb8615a7c","spendAmount":77,"spendDate":"2018-09-20T12:41:59.582Z","spendDescription":"Peter Pipers Poulty Portions for Pets","spendId":"14410eee-1dd7-4501-9e0c-30dfe86137a7"},{"docType":"spend","ngo":"940e6579-dbb4-4bdc-b4fe-36c8ded32c69","spendAmount":77,"spendDate":"2018-09-20T12:41:59.582Z","spendDescription":"Peter Pipers Poulty Portions for Pets","spendId":"16132eae-5416-4d0e-98eb-ca05dc3f0467"},{"docType":"spend","ngo":"144792c3-12b8-4c52-9a88-f452b622056b","spendAmount":227,"spendDate":"2018-09-20T12:41:59.582Z","spendDescription":"Peter Pipers Poulty Portions for Pets","spendId":"2a0b04a4-b077-47e5-8817-fcd56ed92fd9"},{"docType":"spend","ngo":"144792c3-12b8-4c52-9a88-f452b622056b","spendAmount":123,"spendDate":"2018-09-20T12:41:59.582Z","spendDescription":"Peter Pipers Poulty Portions for Pets","spendId":"30098ebe-068d-4006-9c5e-d96bf03267b7"},{"docType":"spend","ngo":"ccaa63aa-e1fd-4e82-a7a7-35ecb8615a7c","spendAmount":1,"spendDate":"2018-09-20T12:41:59.582Z","spendDescription":"Peter Pipers Poulty Portions for Pets","spendId":"d4af3c53-065d-4173-a62a-6aec6fd5d572"}
]

### Get all SpendAllocations

request:
curl -s -X GET http://localhost:3000/spendallocation -H 'content-type: application/json'

response:
[
    {"docType":"spendAllocation","donation":"2f0c6f2f-e948-4ead-a825-65288e42ba0c","ngo":"8cc9bb82-523e-4714-bd96-a742cb2a70b9","spendAllocationAmount":16.5,"spendAllocationDate":"2018-09-20T12:41:59.582Z","spendAllocationDescription":"Peter Pipers Poulty Portions for Pets","spendAllocationId":"12470fafe6fc53cfaf8f7b6a613fa03a206ca5572b54e07b3e3ec59c2c14f31f-0"},{"docType":"spendAllocation","donation":"d939c665-5e7f-4c6c-856d-dbbe07205870","ngo":"8cc9bb82-523e-4714-bd96-a742cb2a70b9","spendAllocationAmount":16.5,"spendAllocationDate":"2018-09-20T12:41:59.582Z","spendAllocationDescription":"Peter Pipers Poulty Portions for Pets","spendAllocationId":"12470fafe6fc53cfaf8f7b6a613fa03a206ca5572b54e07b3e3ec59c2c14f31f-1"},{"docType":"spendAllocation","donation":"0d23f3e6-df32-4f8c-8bb7-74d3f71d27c6","ngo":"940e6579-dbb4-4bdc-b4fe-36c8ded32c69","spendAllocationAmount":38.5,"spendAllocationDate":"2018-09-20T12:41:59.582Z","spendAllocationDescription":"Peter Pipers Poulty Portions for Pets","spendAllocationId":"200e3407959450340cc0794689ad55a79f6880c8836787f76333d472e88240b0-0"},{"docType":"spendAllocation","donation":"7ecc7ab1-5413-46e2-a63f-170fb3542b39","ngo":"940e6579-dbb4-4bdc-b4fe-36c8ded32c69","spendAllocationAmount":38.5,"spendAllocationDate":"2018-09-20T12:41:59.582Z","spendAllocationDescription":"Peter Pipers Poulty Portions for Pets","spendAllocationId":"200e3407959450340cc0794689ad55a79f6880c8836787f76333d472e88240b0-1"},{"docType":"spendAllocation","donation":"c5a1ed06-a0a3-44d2-9473-f43e3552ef41","ngo":"144792c3-12b8-4c52-9a88-f452b622056b","spendAllocationAmount":61.5,"spendAllocationDate":"2018-09-20T12:41:59.582Z","spendAllocationDescription":"Peter Pipers Poulty Portions for Pets","spendAllocationId":"26447efb2c646e98a9b1f60f848e69c8f035fb89c031af81e6acc619f0c5e683-0"},{"docType":"spendAllocation","donation":"5f768ba6-ef44-4141-9a1e-7d7459ab97aa","ngo":"ccaa63aa-e1fd-4e82-a7a7-35ecb8615a7c","spendAllocationAmount":0.5,"spendAllocationDate":"2018-09-20T12:41:59.582Z","spendAllocationDescription":"Peter Pipers Poulty Portions for Pets","spendAllocationId":"a632156dbed92005edf623e9e5cb8e6156b76d4ac6b07b94d641c15b506e367c-0"}
]

## POST methods

### POST Donor

request:
curl -s -X POST "http://localhost:3000/donor" -H "content-type: application/json" -d '{ 
   "donorUserName": "edge", 
   "email": "edge@def.com", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}'

response:
A transaction ID, which can be ignored:

d5b8bc766e0ada43db013643fc17f397eacdb3e95e22ef48271ad5fb33e5abe7

### POST NGO

request:
curl -s -X POST http://localhost:3000/ngo -H 'content-type: application/json' -d '{ 
    "ngoRegistrationNumber": "1234ABCD", 
    "ngoName": "Pets In Need",
    "ngoDescription": "We help pets in need",
    "address": "1 Pet street",
    "contactNumber": "82372837",
    "contactEmail": "pets@petco.com"
}'

response:
A transaction ID, which can be ignored:

d5b8bc766e0ada43db013643fc17f397eacdb3e95e22ef48271ad5fb33e5abe7

### POST Donation

request:
curl -s -X POST http://localhost:3000/donation -H 'content-type: application/json' -d '{ 
        "donationId": "12347890",
        "donationAmount": 100,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "edge",
        "ngo": "1234ABCD"
}'

response:
A transaction ID, which can be ignored:

d5b8bc766e0ada43db013643fc17f397eacdb3e95e22ef48271ad5fb33e5abe7

### POST Spend

request:
curl -s -X POST http://localhost:3000/spend -H 'content-type: application/json' -d '{ 
        "ngo": "1234ABCD",
        "spendId": "12345",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 33
}'

response:
A transaction ID, which can be ignored:

d5b8bc766e0ada43db013643fc17f397eacdb3e95e22ef48271ad5fb33e5abe7

### Get channel

curl -s -X GET   "http://localhost:3000/channels/mychannel"  -H "content-type: application/json"

# Testing
We can test the node application locally or on an EC2 instance. When testing on an EC2 instance 
we need to keep the REST API node application running after we exit the SSH session. I use PM2 to do 
this. `pm2 start app.js` will keep the app running, and logs can be found in `~/.pm2/logs`

# Troubleshooting

Error: [2018-11-06T11:44:51.485] [ERROR] Helper - ##### getRegisteredUser - Failed to get registered user: michael with error: TypeError: Cannot read property 'curve' of undefined

Solution: make sure the certificate stores are removed before starting the REST api. Using `./start.sh` will remove these. The 
error is caused by using the wrong certificate - probably an old one from the cert store.
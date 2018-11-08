#!/bin/bash

set +e
echo To test, run the API server as per the instructions in the README, then execute this script on the command line
export ENDPOINT=Fabric-ELB-205962472.us-west-2.elb.amazonaws.com
export PORT=80
#export ENDPOINT=localhost
#export PORT=3000
echo connecting to server: $ENDPOINT:$PORT
echo
echo 'Register User'
USERID=$(uuidgen)
echo
curl -s -X POST http://${ENDPOINT}:${PORT}/users -H 'content-type: application/x-www-form-urlencoded' -d "username=${USERID}&orgName=Org1"
echo
echo
echo
echo 'Create Donor'
echo
DONOR1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donor -H 'content-type: application/json' -d '{ 
   "donorUserName": "'"${DONOR1}"'", 
   "email": "abc@def.com", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"
echo
DONOR2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donor -H 'content-type: application/json' -d '{ 
   "donorUserName": "'"${DONOR2}"'", 
   "email": "abc@def.com", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"
echo
echo 'Query all donors'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/donor -H 'content-type: application/json'
echo
echo
echo 'Create NGO'
echo
NGO1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/ngo -H 'content-type: application/json' -d '{ 
    "ngoRegistrationNumber": "'"${NGO1}"'", 
    "ngoName": "Pets In Need",
    "ngoDescription": "We help pets in need",
    "address": "1 Pet street",
    "contactNumber": "82372837",
    "contactEmail": "pets@petco.com"
}')
echo "Transaction ID is $TRX_ID"
echo
echo 'Create NGO'
echo
NGO2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/ngo -H 'content-type: application/json' -d '{ 
    "ngoRegistrationNumber": "'"${NGO2}"'", 
    "ngoName": "Pets In Need",
    "ngoDescription": "We help pets in need",
    "address": "1 Pet street",
    "contactNumber": "82372837",
    "contactEmail": "pets@petco.com"
}')
echo "Transaction ID is $TRX_ID"
echo
echo
echo 'Query all NGOs'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/ngo -H 'content-type: application/json'
echo
echo
echo 'Create Donation'
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 100,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "edge",
        "ngo": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION2}"'",
        "donationAmount": 999,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "edge",
        "ngo": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION3=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION3}"'",
        "donationAmount": 75,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "edge",
        "ngo": "'"${NGO2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
echo
echo 'Query all Donations'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json'
echo
echo
echo 'Create Spend'
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 33
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO2}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 100
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 123
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 444
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 1000
}')
echo "Transaction ID is $TRX_ID"
echo
echo
echo 'Query all Spends'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json'
echo
echo 'Query all SpendAllocations'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/spendallocation -H 'content-type: application/json'
echo
echo 'Send a mixture of donations and spends'
echo
echo 'Create Donations & Spends'
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 111,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "edge",
        "ngo": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 222,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "braendle",
        "ngo": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 222,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "edge",
        "ngo": "'"${NGO2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 666
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 227
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO2}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 1
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO2}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 77
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 875,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "braendle",
        "ngo": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 1,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "edge",
        "ngo": "'"${NGO2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spend -H 'content-type: application/json' -d '{ 
        "ngo": "'"${NGO2}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 0
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donation -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 0,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donor": "edge",
        "ngo": "'"${NGO2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
echo 'Query SpendAllocations for Donation'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/spendallocation -H 'content-type: application/json'

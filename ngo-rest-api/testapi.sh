#!/bin/bash

#
# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this
# software and associated documentation files (the "Software"), to deal in the Software
# without restriction, including without limitation the rights to use, copy, modify,
# merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
# INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
# PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
# OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#

set +e
echo To test, run the API server as per the instructions in the README, then execute this script on the command line
echo NOTE: the logger for the REST API server should be running at INFO level, not DEBUG
export ENDPOINT=Fabric-ELB-205962472.us-west-2.elb.amazonaws.com
export PORT=80
export ENDPOINT=localhost
export PORT=3000
echo connecting to server: $ENDPOINT:$PORT
echo
echo 'Register User'
USERID=$(uuidgen)
echo
response=$(curl -s -X POST http://${ENDPOINT}:${PORT}/users -H 'content-type: application/x-www-form-urlencoded' -d "username=${USERID}&orgName=Org1")
echo $response
echo $response | jq ".success"
query=$(echo $response | jq '".success"; contains ("true")' )
echo $query
if [ $query -eq 0 ]; then
        echo success == true
else
        echo ERROR - user was not enrolled
fi
echo $response | jq ".message" | grep "$USERID enrolled Successfully"
echo
echo
echo
echo 'Create Donor'
echo
DONOR1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donors -H 'content-type: application/json' -d '{ 
   "donorUserName": "'"${DONOR1}"'", 
   "email": "abc@def.com", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"
echo
DONOR2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donors -H 'content-type: application/json' -d '{ 
   "donorUserName": "'"${DONOR2}"'", 
   "email": "abc@def.com", 
   "registeredDate": "2018-10-22T11:52:20.182Z" 
}')
echo "Transaction ID is $TRX_ID"
echo
echo 'Query all donors'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/donors -H 'content-type: application/json'
echo
echo 'Query specific donors'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/donors/${DONOR1} -H 'content-type: application/json'
echo
echo 'Create NGO'
echo
NGO1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/ngos -H 'content-type: application/json' -d '{ 
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
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/ngos -H 'content-type: application/json' -d '{ 
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
curl -s -X GET http://${ENDPOINT}:${PORT}/ngos -H 'content-type: application/json'
echo
echo
echo 'Create Donation'
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 100,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donorUserName": "edge",
        "ngoRegistrationNumber": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION2=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION2}"'",
        "donationAmount": 999,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donorUserName": "edge",
        "ngoRegistrationNumber": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION3=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION3}"'",
        "donationAmount": 75,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donorUserName": "edge",
        "ngoRegistrationNumber": "'"${NGO2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
echo
echo 'Query all Donations'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json'
echo
echo
echo 'Create Spend'
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 33
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO2}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 100
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 123
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 444
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO1}"'",
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
curl -s -X GET http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json'
echo
echo 'Query all SpendAllocations'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/spendallocations -H 'content-type: application/json'
echo
echo 'Send a mixture of donations and spends'
echo
echo 'Create Donations & Spends'
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 111,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donorUserName": "edge",
        "ngoRegistrationNumber": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 222,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donorUserName": "braendle",
        "ngoRegistrationNumber": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 222,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donorUserName": "edge",
        "ngoRegistrationNumber": "'"${NGO2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 666
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO1}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 227
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO2}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 1
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO2}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 77
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 875,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donorUserName": "braendle",
        "ngoRegistrationNumber": "'"${NGO1}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 1,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donorUserName": "edge",
        "ngoRegistrationNumber": "'"${NGO2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
SPENDID=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/spends -H 'content-type: application/json' -d '{ 
        "ngoRegistrationNumber": "'"${NGO2}"'",
        "spendId": "'"${SPENDID}"'",
        "spendDescription": "Peter Pipers Poulty Portions for Pets",
        "spendDate": "2018-09-20T12:41:59.582Z",
        "spendAmount": 0
}')
echo "Transaction ID is $TRX_ID"
echo
DONATION1=$(uuidgen)
TRX_ID=$(curl -s -X POST http://${ENDPOINT}:${PORT}/donations -H 'content-type: application/json' -d '{ 
        "donationId": "'"${DONATION1}"'",
        "donationAmount": 0,
        "donationDate": "2018-09-20T12:41:59.582Z",
        "donorUserName": "edge",
        "ngoRegistrationNumber": "'"${NGO2}"'"
}')
echo "Transaction ID is $TRX_ID"
echo
echo 'Query SpendAllocations for Donation'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/spendallocationss?donationId=${DONATION1} -H 'content-type: application/json'
echo
echo
echo 'Query Blockinfo for a record key'
echo
curl -s -X GET http://${ENDPOINT}:${PORT}/blockinfos/spendAllocation/keys/12345 -H 'content-type: application/json'

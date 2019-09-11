# Troubleshooting

## Known Issues

1. API server thows the error with the following message: "TypeError: Cannot read property 'curve' of undefined"

    The most common problem causing this error is that API server can't access the keys and certificates of the user that is used to initilize the Hyperledger Fabric client. A quick fix is the following:
   
   * In `./connection-profile/client-org1.yaml`: look up the location path of the Key/Value store that keeps the keys and certs of API users. By default it's `./fabric-client-keys-org1` for crypto store (the keys) and `./fabric-client-certs-org1` for credentials store (certificates and other config info). 
   * Delete both folders and re-start the server.
   * Trigger a call to the blockchain peer. That will re-enroll the admin user and re-create it's credentials.

   If the error still persists, you possibly previously configured another user to perform non-admin calls. To confirm, have a look at `./config.json`. E.g. you may see something like this:
   ```
   {
      [...],
      "userName":"michael",
      "orgName":"Org1",
      [...]
   }
   ```
   In this case re-register that user as well using the following call:
      ```
      curl -s -X POST http://localhost:3000/users -H "content-type: application/x-www-form-urlencoded" -d 'username=michael&orgName=Org1'
      ``` 
      And then try again.


2. If you see something like this in the logs:

##### invokeChaincode - Invoke transaction request to Fabric {"targets":["peer1"],"chaincodeId":"ngo","fcn":"createSpend","args":["{\"spendId\":\"43a4d8be-c9f7-4d45-9f25-6074d312ee47\",\"spendDescription\":\"Peter Pipers Poulty Portions for Pets\",\"spendDate\":\"2018-09-20T12:41:59.582Z\",\"spendAmount\":22}"],"chainId":"mychannel","txId":{"_nonce":{"type":"Buffer","data":[78,51,96,123,70,26,73,101,108,20,68,49,246,213,77,198,106,37,113,217,60,230,97,118]},"_transaction_id":"c600ae42fc8ef3dffb50a2b27710d2b6488cf7bc2a90032299be78220ae0a113","_admin":false}}
[2019-03-15T05:41:41.344] [ERROR] Invoke - ##### invokeChaincode - received unsuccessful proposal response
[2019-03-15T05:41:41.344] [INFO] Invoke - ##### invokeChaincode - Failed to send Proposal and receive all good ProposalResponse. Status code: undefined, 2 UNKNOWN: access denied: channel [mychannel] creator org [org1MSP]
Error: 2 UNKNOWN: access denied: channel [mychannel] creator org [org1MSP]


The identities used by the REST API are being cached. You could try removing the cache directories, though you may have to re-enroll the users:

```
rm -rf ./fabric-client-keys-org1
rm -rf ./fabric-client-certs-org1
```
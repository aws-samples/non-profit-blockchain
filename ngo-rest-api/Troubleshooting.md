# Troubleshooting

Error: [2018-11-06T11:44:51.485] [ERROR] Helper - ##### getRegisteredUser - Failed to get registered user: michael with error: TypeError: Cannot read property 'curve' of undefined

Solution: make sure the certificate stores are removed before starting the REST api. Using `./start.sh` will remove these. The 
error is caused by using the wrong certificate - probably an old one from the cert store.


[2018-11-16T10:25:40.240] [ERROR] Connection - ##### getRegisteredUser - Failed to get registered user: 5742cbbe-03b6-449d-ab65-3c885b6bfee1 with error: Error: Enrollment failed with errors [[{"code":19,"message":"CA 'ca.esxh3vewtnhsrldv5du3p52zpq' does not exist"}]]

We need to the name of the Fabric CA, as set in the CA, in FABRIC_CA_SERVER_CA_NAME
# ngo

ngo blockchain network using Hyperledger Composer. Since Composer has been put on hold, I redeveloped this using Fabric with Node.js chaincode

This readme provides details on how to develop the Composer business network and test it locally.

## Pre-requisites
Deploy the Hyperledger Composer development environment using these instructions: https://hyperledger.github.io/composer/latest/installing/development-tools.html

## Getting started
I started this business network using the Yeoman generator. Instructions are here, see Step One: https://hyperledger.github.io/composer/latest/tutorials/developer-tutorial

After using Yeoman to generate a skeleton, I populated the model and transaction files. 

## Generate the business network (BNA)
Package the business network into a BNA file. See Step Three: https://hyperledger.github.io/composer/latest/tutorials/developer-tutorial

In the directory where this repo is cloned:

```
./create-bna.sh
```

Look for the output file: ngo@0.0.2.bna (note, the version number may differ)

## Run Hyperledger Fabric locally
This should have been setup earlier in the Getting Started section. In the folder
/Users/edgema/fabric-dev-servers (your folder may differ), run the following:

```
./startFabric.sh
```

## Install the BNA on the local Fabric network
See Step Four: https://hyperledger.github.io/composer/latest/tutorials/developer-tutorial

```
./install-bna.sh
```

## Start the BNA
```
./start-bna.sh
```

## Import the network admin identity
```
./importcard-bna.sh
```

## Test the network is running
```
$ ./ping-bna.sh
The connection to the network was successfully tested: ngo
	Business network version: 0.0.2
	Composer runtime version: 0.20.0
	participant: org.hyperledger.composer.system.NetworkAdmin#admin
	identity: org.hyperledger.composer.system.Identity#c9992b14d3ab59822b5fa4aa654a5d380239c922d0c51692e5f073972b29d688

Command succeeded
```

## Start Composer Playground
Composer Playground will allow you to use a UI to model your network. Playground will connect to
the Fabric network you started above and allow you to edit the BNA you deployed.

This should have been installed earlier in the Getting Started section. In the folder
/Users/edgema/fabric-dev-servers (your folder may differ), run the following:

```
composer-playground
```

You should be redirected to a browser page. If prompted, select to clear the existing cache.

In the UI, connect to the ngo network.

From now on, any actions you take, such as adding participants via the CLI, will be reflected in the UI Playground.

## Add participants
You could add a participant via the Composer Playground. In the UI, you would select Test, then Donor, then 
'Create New Participant'. This would allow you to create a Donor (i.e. an instance of a Donor participant).

You could also do the same thing using the CLI. In this repo, run ./test/add-donor.sh. This will add a Donor.
You can see this in the UI Playground by clicking on Donor under Participants. 

Do the same to add an NGO (./test/add-ngo.sh)

## Run a transaction
To add a donation, which is an amount of money transferred from a Donor to an NGO, do the following:

```
./test/add-donation-tx.sh
```

You can see the console.log output statements from the execution of the transaction chaincode by 
doing a `docker ps`, then viewing the output of the chaincode container. For example:

```
$ docker ps
CONTAINER ID        IMAGE                                                                                                            COMMAND                  CREATED             STATUS              PORTS                                            NAMES
6e2d99da4580        dev-peer0.org1.example.com-ngo-0.0.5-deploy.1-102e6768c8256e5ac86fc7dbecd4a93a58b679545089b1e7d639998768fd80dc   "/bin/sh -c 'cd /usr…"   40 seconds ago      Up 49 seconds                                                        dev-peer0.org1.example.com-ngo-0.0.5-deploy.1
e5f887f98b55        dev-peer0.org1.example.com-ngo-0.0.5-deploy.0-b764f7d96f83719f3cbdfdf52b24e1b38d4dba1f425dd31957c47b8b0a39dba2   "/bin/sh -c 'cd /usr…"   14 minutes ago      Up 14 minutes                                                        dev-peer0.org1.example.com-ngo-0.0.5-deploy.0
cc584e73cf40        dev-peer0.org1.example.com-ngo-0.0.4-f8400d84b5686c276a893184585d12c91671f3dcc0ec588baab421ba13d3950d            "/bin/sh -c 'cd /usr…"   15 minutes ago      Up 16 minutes                                                        dev-peer0.org1.example.com-ngo-0.0.4
13d21c478525        hyperledger/fabric-peer:1.2.0                                                                                    "peer node start"        18 minutes ago      Up 18 minutes       0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp   peer0.org1.example.com
7ddf38696587        hyperledger/fabric-ca:1.2.0                                                                                      "sh -c 'fabric-ca-se…"   18 minutes ago      Up 18 minutes       0.0.0.0:7054->7054/tcp                           ca.org1.example.com
6b1761b3a31c        hyperledger/fabric-couchdb:0.4.10                                                                                "tini -- /docker-ent…"   18 minutes ago      Up 18 minutes       4369/tcp, 9100/tcp, 0.0.0.0:5984->5984/tcp       couchdb
901ad3051bf2        hyperledger/fabric-orderer:1.2.0                                                                                 "orderer"                18 minutes ago      Up 18 minutes       0.0.0.0:7050->7050/tcp                           orderer.example.com
```

```
docker logs e5f887f98b55
```

In Composer Playground you should see the Donation under Assets in the Test tab.

You can do the same to add a rating:

```
./test/add-rating-tx.sh
```

## Upgrading the business network
After making changes to the model or logic.js you'll need to upgrade your BNA. Update the new version
number in the following files:

* package.json
* install-bna.sh
* upgrade-bna.sh

The follow the instructions here: https://hyperledger.github.io/composer/latest/business-network/upgrading-bna

## Generating the REST API
To generate the REST API, run the following:

```
./gen-rest.sh
```

Then browse the REST API at: http://localhost:3000/explorer 

## Obtaining the Swagger Open API specification
After generating and running the REST API, you can obtain the open api spec here:

http://localhost:3000/explorer/swagger.json

# Events
This composer business model emits a number of events, such as:

* Donation notification
* Spend notification

These events are defined in the model file: org.mcldg.ngo.cto. You can view them in the Composer Playground
after creating a donation or spend transaction.

These events can be subscribed to by a Node.js client application using the instructions here:

https://hyperledger.github.io/composer/latest/applications/subscribing-to-events.html

# Viewing your data in CouchDB
To view the Fabric world state that is maintained by your Composer project, you can 'exec' into
the CouchDB docker container and use CURL:

```
$ docker ps
CONTAINER ID        IMAGE                                                                                                    COMMAND                  CREATED             STATUS              PORTS                                            NAMES
d2793d17e5bf        dev-peer0.org1.example.com-ngo-0.1.11-7dbd56b72b1ee0cd3f69b2602f365322db9cd454eb1224cb13868478b33f33ef   "/bin/sh -c 'cd /usr…"   34 minutes ago      Up 34 minutes                                                        6a087746ed05        hyperledger/fabric-peer:1.2.0                                                                            "peer node start"        2 days ago          Up 2 days           0.0.0.0:7051->7051/tcp, 0.0.0.0:7053->7053/tcp   peer0.org1.example.com
96c900498f17        hyperledger/fabric-orderer:1.2.0                                                                         "orderer"                2 days ago          Up 2 days           0.0.0.0:7050->7050/tcp                           orderer.example.com
532c62acd367        hyperledger/fabric-ca:1.2.0                                                                              "sh -c 'fabric-ca-se…"   2 days ago          Up 2 days           0.0.0.0:7054->7054/tcp                           ca.org1.example.com
13470cde0560        hyperledger/fabric-couchdb:0.4.10                                                                        "tini -- /docker-ent…"   2 days ago          Up 2 days           4369/tcp, 9100/tcp, 0.0.0.0:5984->5984/tcp       couchdb
```

Now exec into the CouchDB container:

```
docker exec -it 13470cde0560 bash
```

Once inside the container you can use CURL commands to query CouchDB. Here are some examples:

```
# curl localhost:5984
{"couchdb":"Welcome","version":"2.1.1","features":["scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

# curl localhost:5984/_all_dbs
["_global_changes","_replicator","_users","composerchannel_","composerchannel_lscc","composerchannel_ngo"]

# curl localhost:5984/composerchannel_ngo/_all_docs
{"total_rows":106,"offset":0,"rows":[
{"id":"\u0000$syscollections\u0000Transaction:org.mcldg.ngo.donate\u0000","key":"\u0000$syscollections\u0000Transaction:org.mcldg.ngo.donate\u0000","value":{"rev":"1-a3358a497f0a86026b4253768552d5b3"}},
.
.
.
{"id":"\u0000$sysregistries\u0000Asset:org.mcldg.ngo.Donation\u0000","key":"\u0000$sysregistries\u0000Asset:org.mcldg.ngo.Donation\u0000","value":{"rev":"1-35be5ea22b9885744ea753353daa7122"}},
{"id":"\u0000$sysregistries\u0000Asset:org.mcldg.ngo.NGOSpend\u0000",
```

Out of interest, if you are looking for your ledger on the peer node you can find it here:

```
# ls -l /var/hyperledger/production/ledgersData/
total 24
drwxr-xr-x 2 root root 4096 Oct 10 10:24 bookkeeper
drwxr-xr-x 4 root root 4096 Oct 10 10:24 chains
drwxr-xr-x 2 root root 4096 Oct 10 10:24 configHistory
drwxr-xr-x 2 root root 4096 Oct 10 10:24 historyLeveldb
drwxr-xr-x 2 root root 4096 Oct 10 10:24 ledgerProvider
drwxr-xr-x 2 root root 4096 Oct 10 10:24 pvtdataStore
```

# Viewing the chaincode
Composer installs its own chaincode, which provides a runtime to interpret composer business network models
and execute transactions on the business network. The composer chaincode is installed into your Fabric
network - it can be found here:

https://github.com/hyperledger/composer/tree/master/packages/composer-runtime-hlfv1

```
# export CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp
# peer chaincode list --installed
Get installed chaincodes on peer:
Name: ngo, Version: 0.1.36, Path: /var/folders/xp/46pq0tnx2cb41fv3d8htq_wnprhttw/T/businessnetwork118910-2309-1flyqxp.ttl8i, Id: d07f5dec05bdde671d07beeecef23a19f824b9fd1731404070c2b8ea535e24ae
```

On your peer node you'll find the chaincode here:

```
# ls -l /var/hyperledger/production/chaincodes/
total 12
-rw-r--r-- 1 root root 8308 Oct 10 10:25 ngo.0.1.36
```


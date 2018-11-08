
# Setting up Hyperledger Composer on an AWS EC2 instance

This README provides details on how to get the Composer business network up and running on an AWS Ubuntu image.

I lost patience trying to get this working on Amazon Linux, so I switched to Ubuntu. Start by creating an Ubuntu 16.04 LTS
EC2 instance. When launching the instance, as you step through the create instance wizard, increase the disk 
space to something larger, such as 50GB. This is to ensure we have enough space to store the Docker images.

Then simply use the script mentioned here to install all the pre-reqs:

https://hyperledger.github.io/composer/latest/installing/installing-prereqs.html

Then steps 1 & 2 here to install Hyperledger Composer (commands are below for your convenience): 

https://hyperledger.github.io/composer/latest/installing/development-tools.html

```bash
npm install -g composer-cli@0.20
npm install -g composer-rest-server@0.20
npm install -g generator-hyperledger-composer@0.20
npm install -g yo
npm install -g composer-playground@0.20
```

Test that the installation worked:

```bash
$ composer card list
There are no Business Network Cards available.

Command succeeded
```

## Steps to building a Composer Network
I follows the steps here: https://hyperledger.github.io/composer/latest/tutorials/deploy-to-fabric-multi-org

The steps numbers I use below match those in the document referred to by the URL above. I have made some tweaks to
a few commands to make them easier to use.

You have two options when following these instructions. You can:

* Follow them exactly. You'll end up with a Fabric network and a Composer network, both having 2 orgs
* Only follow the steps for org1. You'll end up with a Fabric network support 2 orgs, and a Composer network 
supporting 1 org. You can then follow the subsequent steps in this readme to add org2. This is an example of how
to add a new org to a composer network, assuming the org has already been added to the Fabric network.

### Pre-reqs
Clone the repo:

```bash
git clone https://github.com/mahoney1/fabric-samples.git
```

### Step 1
```bash
cd fabric-samples
curl -sSL http://bit.ly/2ysbOFE | bash -s 1.2.1 1.2.1 0.4.10
git checkout multi-org
cd first-network
./byfn.sh -m generate
```

Start Fabric:

```bash
./byfn.sh -m up -s couchdb -a
```

### Step 2
Create temp directory:

```bash
rm -rf /tmp/composer
mkdir -p /tmp/composer/org1
mkdir -p /tmp/composer/org2
```

Copy the connection profile listed in the article (https://hyperledger.github.io/composer/latest/tutorials/deploy-to-fabric-multi-org) 
to /tmp/composer, and save it as instructed to a file called: `byfn-network.json`.

```bash
vi /tmp/composer/byfn-network.json
```
If you are doing this only for Org1, you'll need to manually remove all the org2 entries in the connection profile so that it 
looks as follows:

```bash
{
    "name": "byfn-network",
    "x-type": "hlfv1",
    "version": "1.0.0",
    "channels": {
        "mychannel": {
            "orderers": [
                "orderer.example.com"
            ],
            "peers": {
                "peer0.org1.example.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "eventSource": true
                },
                "peer1.org1.example.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "eventSource": true
                }
            }
        }
    },
    "organizations": {
        "Org1": {
            "mspid": "Org1MSP",
            "peers": [
                "peer0.org1.example.com",
                "peer1.org1.example.com"
            ],
            "certificateAuthorities": [
                "ca.org1.example.com"
            ]
        }
    },
    "orderers": {
        "orderer.example.com": {
            "url": "grpcs://localhost:7050",
            "grpcOptions": {
                "ssl-target-name-override": "orderer.example.com"
            },
            "tlsCACerts": {
                "pem": "INSERT_ORDERER_CA_CERT"
            }
        }
    },
    "peers": {
        "peer0.org1.example.com": {
            "url": "grpcs://localhost:7051",
            "grpcOptions": {
                "ssl-target-name-override": "peer0.org1.example.com"
            },
            "tlsCACerts": {
                "pem": "INSERT_ORG1_CA_CERT"
            }
        },
        "peer1.org1.example.com": {
            "url": "grpcs://localhost:8051",
            "grpcOptions": {
                "ssl-target-name-override": "peer1.org1.example.com"
            },
            "tlsCACerts": {
                "pem": "INSERT_ORG1_CA_CERT"
            }
        }
    },
    "certificateAuthorities": {
        "ca.org1.example.com": {
            "url": "https://localhost:7054",
            "caName": "ca-org1",
            "httpOptions": {
                "verify": false
            }
        }
    }
}
```

Now, instead of using the manual steps in the article, we'll automate updating the connection profile with the appropriate
certs. Only update org1 and orderer if doing this for org1 only.

Update the cert for Org1:

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt > /tmp/composer/org1/ca-org1.txt
gawk -i inplace -v INPLACE_SUFFIX=.bak 'NR==FNR {cert=$0;next} {gsub("INSERT_ORG1_CA_CERT",cert)}1 ' /tmp/composer/org1/ca-org1.txt /tmp/composer/byfn-network.json
```

Update the cert for Org2:

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt > /tmp/composer/org2/ca-org2.txt
gawk -i inplace -v INPLACE_SUFFIX=.bak 'NR==FNR {cert=$0;next} {gsub("INSERT_ORG2_CA_CERT",cert)}1 ' /tmp/composer/org2/ca-org2.txt /tmp/composer/byfn-network.json
```

Update the orderer cert:

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt > /tmp/composer/ca-orderer.txt
gawk -i inplace -v INPLACE_SUFFIX=.bak 'NR==FNR {cert=$0;next} {gsub("INSERT_ORDERER_CA_CERT",cert)}1 ' /tmp/composer/ca-orderer.txt /tmp/composer/byfn-network.json
```

### Step 3
Complete the connections profile for Org1:

```bash
cp /tmp/composer/byfn-network.json /tmp/composer/org1/byfn-network-org1.json
vi /tmp/composer/org1/byfn-network-org1.json
```

Insert the text below just below the `version` tag and above the `channel` tag:

```bash
    "client": {
        "organization": "Org1",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300",
                    "eventHub": "300",
                    "eventReg": "300"
                },
                "orderer": "300"
            }
        }
    },
```

### Step 4
Do the same for Org2

```bash
cp /tmp/composer/byfn-network.json /tmp/composer/org2/byfn-network-org2.json
vi /tmp/composer/org2/byfn-network-org2.json
```

Insert the text below just below the `version` tag and above the `channel` tag:

```bash
    "client": {
        "organization": "Org2",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300",
                    "eventHub": "300",
                    "eventReg": "300"
                },
                "orderer": "300"
            }
        }
    },
```

### Step 5
Store a copy of the public cert and private key for Org1:

```bash
export ORG1=crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
cp -p $ORG1/signcerts/A*.pem /tmp/composer/org1
cp -p $ORG1/keystore/*_sk /tmp/composer/org1
ls -lR /tmp/composer/org1
```

### Step 6
Do the same for Org2:

```bash
export ORG2=crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
cp -p $ORG2/signcerts/A*.pem /tmp/composer/org2
cp -p $ORG2/keystore/*_sk /tmp/composer/org2
ls -lR /tmp/composer/org2
```

### Step 7
Create the business network card for org1:

```bash
composer card create -p /tmp/composer/org1/byfn-network-org1.json -u PeerAdmin -c /tmp/composer/org1/Admin@org1.example.com-cert.pem -k /tmp/composer/org1/*_sk -r PeerAdmin -r ChannelAdmin -f PeerAdmin@byfn-network-org1.card
ls -l *.card
```

### Step 8
Do the same for org2:

```bash
composer card create -p /tmp/composer/org2/byfn-network-org2.json -u PeerAdmin -c /tmp/composer/org2/Admin@org2.example.com-cert.pem -k /tmp/composer/org2/*_sk -r PeerAdmin -r ChannelAdmin -f PeerAdmin@byfn-network-org2.card
ls -l *.card
```

### Step 9
Import the business card into the wallet for org1:

```bash
composer card import -f PeerAdmin@byfn-network-org1.card --card PeerAdmin@byfn-network-org1
ls -l ~/.composer/cards
```

### Step 10
Import the business card into the wallet for org2:

```bash
composer card import -f PeerAdmin@byfn-network-org2.card --card PeerAdmin@byfn-network-org2
ls -l ~/.composer/cards
```

### Step 11
----TODO - step here to clone a repo which contains the bna
Install the business network on the peers in your org1:

```bash
composer network install --card PeerAdmin@byfn-network-org1 --archiveFile ~/ngo@0.1.36.bna
```

### Step 12
----TODO - step here to clone a repo which contains the bna
Install the business network on the peers in your org1:

```bash
composer network install --card PeerAdmin@byfn-network-org2 --archiveFile ~/ngo@0.1.36.bna
```

### Step 13
Create the endorsement policy. There are two version below, depending on whether you are creating a composer network
with both orgs, or only for org1

#### Both orgs
```bash
cat > /tmp/composer/endorsement-policy.json << EOF
{
    "identities": [
        {
            "role": {
                "name": "member",
                "mspId": "Org1MSP"
            }
        },
        {
            "role": {
                "name": "member",
                "mspId": "Org2MSP"
            }
        }
    ],
    "policy": {
        "1-of": [
            {
                "signed-by": 0
            },
            {
                "signed-by": 1
            }
        ]
    }
}
EOF
```

#### org1
```bash
cat > /tmp/composer/endorsement-policy.json << EOF
{
    "identities": [
        {
            "role": {
                "name": "member",
                "mspId": "Org1MSP"
            }
        }
    ],
    "policy": {
        "1-of": [
            {
                "signed-by": 0
            }
        ]
    }
}
EOF
```
### Step 15
Retrieve the certificates for business network administrator for org1. We will use the certs to start the business
network, and we will also create a user (alice) to administer the network based on these certs later on:

```bash
composer identity request -c PeerAdmin@byfn-network-org1 -u admin -s adminpw -d alice
```

### Step 16
Do the same for org2:

```bash
composer identity request -c PeerAdmin@byfn-network-org2 -u admin -s adminpw -d bob
```

### Step 17
---- TODO how do I add a new org or user to an existing network without having to start/restart it?
Start the business network.

Note that we provide the certs for all the orgs when starting the network:

#### Both orgs
```bash
composer network start -c PeerAdmin@byfn-network-org1 -n ngo -V 0.1.36 -o endorsementPolicyFile=/tmp/composer/endorsement-policy.json -A alice -C alice/admin-pub.pem -A bob -C bob/admin-pub.pem
```

#### org1
```bash
composer network start -c PeerAdmin@byfn-network-org1 -n ngo -V 0.1.36 -o endorsementPolicyFile=/tmp/composer/endorsement-policy.json -A alice -C alice/admin-pub.pem
```

### Step 18
Create a business card that 'alice', the org1 network admin, can use to access the network:

```bash
composer card create -p /tmp/composer/org1/byfn-network-org1.json -u alice -n ngo -c alice/admin-pub.pem -k alice/admin-priv.pem
composer card import -f alice@ngo.card
```

Then ping the network:

```bash
$ composer network ping -c alice@ngo
The connection to the network was successfully tested: ngo
	Business network version: 0.1.36
	Composer runtime version: 0.20.2
	participant: org.hyperledger.composer.system.NetworkAdmin#alice
	identity: org.hyperledger.composer.system.Identity#a60c398dcc6a49f4552c3e7fcf9dc364d0fe7668712d68483cd0f12f573d2030

Command succeeded
```

Create a participant. This participant is part of the business network, i.e. a participant according to the 
Hyperledger Composer definition, based on an actual Composer resource:

```bash
composer participant add -c alice@ngo -d '{"$class": "org.mcldg.ngo.Donor", "donorUserName": "edge", "email": "edge@amazon.com", "registeredDate": "2018-09-20T12:28:24.082Z"}'
```

Now create a Composer identity for this participant. This will enable the participant to execute transactions against
the network:

```bash
composer identity issue -c alice@ngo -f edge.card -u edge -a "resource:org.mcldg.ngo.Donor#edge"
```

Finally, import their business card and test that they can access the business network:

```bash
composer card import -f edge.card
ls -l ~/.composer/cards
composer network ping -c edge@ngo
```

### Step 19
Do the same for org2:

```bash
composer card create -p /tmp/composer/org2/byfn-network-org2.json -u bob -n ngo -c bob/admin-pub.pem -k bob/admin-priv.pem
composer card import -f bob@ngo.card
```

Then ping the network:

```bash
$ composer network ping -c bob@ngo
The connection to the network was successfully tested: ngo
	Business network version: 0.1.36
	Composer runtime version: 0.20.2
	participant: org.hyperledger.composer.system.NetworkAdmin#bob
	identity: org.hyperledger.composer.system.Identity#11d177c2814fe17d050a8b2752f14bf194bdb0741954c203e2d7670e9d682f37

Command succeeded
```

Create a participant. 

```bash
composer participant add -c bob@ngo -d '{"$class": "org.mcldg.ngo.Donor", "donorUserName": "braendle", "email": "braendle@amazon.com", "registeredDate": "2018-09-20T12:28:24.082Z"}'
```

Now create a Composer identity for this participant. This will enable the participant to execute transactions against
the network:

```bash
composer identity issue -c bob@ngo -f braendle.card -u braendle -a "resource:org.mcldg.ngo.Donor#braendle"
```

Finally, import their business card and test that they can access the business network:

```bash
composer card import -f braendle.card
ls -l ~/.composer/cards
composer network ping -c braendle@ngo
```

## Create network participants

composer transaction submit --card alice@ngo --data  '{
 "$class": "org.hyperledger.composer.system.AddParticipant",
 "resources": [
    {
    "$class": "org.mcldg.ngo.NGO",
    "ngoRegistrationNumber": "6322",
    "ngoName": "Pets In Need",
    "ngoDescription": "We help pets in need",
    "address": "1 Pet street",
    "contactNumber": "82372837",
    "contactEmail": "pets@petco.com"
    }
 ],
 "targetRegistry": "resource:org.hyperledger.composer.system.ParticipantRegistry#org.mcldg.ngo.NGO"
}'

## Create assets

composer transaction submit --card edge@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#edge",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "123",
    "donationAmount": 90
}'

composer transaction submit --card edge@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#edge",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "456",
    "donationAmount": 275
}'

composer transaction submit --card braendle@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#braendle",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "789",
    "donationAmount": 150
}'

composer transaction submit --card braendle@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#braendle",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "012",
    "donationAmount": 325
}'

composer transaction submit --card edge@ngo --data  '{
    "$class": "org.mcldg.ngo.donate",
    "donor": "resource:org.mcldg.ngo.Donor#edge",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "donationId": "345",
    "donationAmount": 115
}'

composer transaction submit --card edge@ngo --data  '{
    "$class": "org.mcldg.ngo.rate",
    "donor": "resource:org.mcldg.ngo.Donor#edge",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "ratingId": "123",
    "rating": 5
}'

composer transaction submit --card braendle@ngo --data  '{
    "$class": "org.mcldg.ngo.rate",
    "donor": "resource:org.mcldg.ngo.Donor#braendle",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "ratingId": "456",
    "rating": 4
}'

## Submit spend transactions

composer transaction submit --card edge@ngo --data  '{
    "$class": "org.mcldg.ngo.spend",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "spendId": "1",
    "spendDescription": "Charlies Chunky Cat chowder",
    "spendAmount": 40
}'
composer transaction submit --card braendle@ngo --data  '{
    "$class": "org.mcldg.ngo.spend",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "spendId": "2",
    "spendDescription": "Peter Pipers Poulty Portions for Pets",
    "spendAmount": 33
}'
composer transaction submit --card edge@ngo --data  '{
    "$class": "org.mcldg.ngo.spend",
    "ngo": "resource:org.mcldg.ngo.NGO#6322",
    "spendId": "3",
    "spendDescription": "Tasty Terrier Treats",
    "spendAmount": 731
}'

## List the resources in the business network

```bash
composer network list -c edge@ngo
```

## Run the REST server in a docker container
```bash
composer-rest-server --card alice@ngo --port 8080
```
or, if you want the REST server to keep running after closing the SSH session:

```bash
nohup composer-rest-server --card alice@ngo --port 8080 > ~/.composer/logs/restlog.log &
```

You will need to expose this publicly if you want others to access this. Temporarily I have simply opened the security
group to allow port 8080.

Running the REST server in Docker did not work - I have not researched the reason why:

```bash
docker run -d -e COMPOSER_CARD="alice@ngo" -e COMPOSER_NAMESPACES="never" -v ~/.composer:/home/composer/.composer --name rest -p 8080:3000 hyperledger/composer-rest-server
```

## If you want to interact with the business network using composer playground
Run the Composer Playground. This will run an application that is accessed via the browser.  

You will need to expose this publicly if you want others to access this. 

```bash
composer-playground
```

## A note on installing the business network
Step 11 in https://hyperledger.github.io/composer/latest/tutorials/deploy-to-fabric-multi-org
states that you need to install the trade-sample.bna, but it doesn't provide this file. Instead of following
these steps I installed my ngo.bna in this step, and step 12.

I copied the bna file from my Mac to my Ubuntu instance using scp:

```bash
scp -i ~/Downloads/fabric-composer-ubuntu.pem ngo-blockchain/ngo/ngo@0.1.36.bna ubuntu@ec2-34-217-77-198.us-west-2.compute.amazonaws.com:/home/ubuntu
```

Then installed the bna:

```bash
cd 
cd fabric-samples/first-network
composer network install --card PeerAdmin@byfn-network-org1 --archiveFile ~/ngo@0.1.36.bna
composer network install --card PeerAdmin@byfn-network-org2 --archiveFile ~/ngo@0.1.36.bna
```

## What next?
At this point you have a Composer business network up and running, with two organisations in the network. The next 
step would be to add a new organisation to the Composer network.

I tried this by running all the steps above for org1 only. This gives us a Fabric network with org1 and org2, but a
Composer network that only has org1. Then, I tried adding org2 into the Composer network using the steps below.

# Add a new organisation to the Composer network
If you followed the steps above to create a Composer network with only org1, at this point you have a Fabric network 
running with org1 and org2, and a Composer network with only org1. I can install chaincode and run TX using either of
these orgs, but I cannot interact with the Composer network via org2. Now I need to add org2 to the Composer network.

### As org2

```bash
rm -rf /tmp/composer/org2
mkdir -p /tmp/composer/org2
```
Create the connection profile for org2.

```bash
vi /tmp/composer/org2/byfn-network-org2.json
```

Insert this:

```bash
{
    "name": "byfn-network",
    "x-type": "hlfv1",
    "version": "1.0.0",
    "channels": {
        "mychannel": {
            "orderers": [
                "orderer.example.com"
            ],
            "peers": {
                "peer0.org2.example.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "eventSource": true
                },
                "peer1.org2.example.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "eventSource": true
                }
            }
        }
    },
    "organizations": {
        "Org2": {
            "mspid": "Org2MSP",
            "peers": [
                "peer0.org2.example.com",
                "peer1.org2.example.com"
            ],
            "certificateAuthorities": [
                "ca.org2.example.com"
            ]
        }
    },
    "orderers": {
        "orderer.example.com": {
            "url": "grpcs://localhost:7050",
            "grpcOptions": {
                "ssl-target-name-override": "orderer.example.com"
            },
            "tlsCACerts": {
                "pem": "INSERT_ORDERER_CA_CERT"
            }
        }
    },
    "peers": {
        "peer0.org2.example.com": {
            "url": "grpcs://localhost:9051",
            "grpcOptions": {
                "ssl-target-name-override": "peer0.org2.example.com"
            },
            "tlsCACerts": {
                "pem": "INSERT_ORG2_CA_CERT"
            }
        },
        "peer1.org2.example.com": {
            "url": "grpcs://localhost:10051",
            "grpcOptions": {
                "ssl-target-name-override": "peer1.org2.example.com"
            },
            "tlsCACerts": {
                "pem": "INSERT_ORG2_CA_CERT"
            }
        }
    },
    "certificateAuthorities": {
        "ca.org2.example.com": {
            "url": "https://localhost:8054",
            "caName": "ca-org2",
            "httpOptions": {
                "verify": false
            }
        }
    }
}
```

Now, instead of using the manual steps in the article, we'll automate updating the connection profile with the appropriate
certs. 

Update the cert for Org2:

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt > /tmp/composer/org2/ca-org2.txt
gawk -i inplace -v INPLACE_SUFFIX=.bak 'NR==FNR {cert=$0;next} {gsub("INSERT_ORG2_CA_CERT",cert)}1 ' /tmp/composer/org2/ca-org2.txt /tmp/composer/org2/byfn-network-org2.json
```

Update the orderer cert:

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt > /tmp/composer/ca-orderer.txt
gawk -i inplace -v INPLACE_SUFFIX=.bak 'NR==FNR {cert=$0;next} {gsub("INSERT_ORDERER_CA_CERT",cert)}1 ' /tmp/composer/ca-orderer.txt /tmp/composer/org2/byfn-network-org2.json
```

Complete the connections profile for Org2:

```bash
vi /tmp/composer/org2/byfn-network-org2.json
```

Insert the text below just below the `version` tag and above the `channel` tag:

```bash
    "client": {
        "organization": "Org2",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300",
                    "eventHub": "300",
                    "eventReg": "300"
                },
                "orderer": "300"
            }
        }
    },
```

Store a copy of the public cert and private key for Org2:

```bash
export ORG2=crypto-config/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
cp -p $ORG2/signcerts/A*.pem /tmp/composer/org2
cp -p $ORG2/keystore/*_sk /tmp/composer/org2
ls -lR /tmp/composer/org2
```

Create the business network card for org2:

```bash
composer card create -p /tmp/composer/org2/byfn-network-org2.json -u PeerAdmin -c /tmp/composer/org2/Admin@org2.example.com-cert.pem -k /tmp/composer/org2/*_sk -r PeerAdmin -r ChannelAdmin -f PeerAdmin@byfn-network-org2.card
ls -l *.card
```

Import the business card into the wallet for org2:

```bash
composer card import -f PeerAdmin@byfn-network-org2.card --card PeerAdmin@byfn-network-org2
ls -l ~/.composer/cards
```

Install the business network on the peers in your org1:

```bash
composer network install --card PeerAdmin@byfn-network-org2 --archiveFile ~/ngo@0.1.36.bna
```

### Step 13
Create the endorsement policy:

```bash
cat > /tmp/composer/endorsement-policy.json << EOF
{
    "identities": [
        {
            "role": {
                "name": "member",
                "mspId": "Org1MSP"
            }
        },
        {
            "role": {
                "name": "member",
                "mspId": "Org2MSP"
            }
        }
    ],
    "policy": {
        "1-of": [
            {
                "signed-by": 0
            },
            {
                "signed-by": 1
            }
        ]
    }
}
EOF
```

Retrieve the certificates for business network administrator for org2. We will use the certs to start the business
network, and we will also create a user (bob) to administer the network based on these certs later on:

```bash
composer identity request -c PeerAdmin@byfn-network-org2 -u admin -s adminpw -d bob
```

### As org1

NOW, this is where it differs from the original process. Instead of doing a 'composer network start' we need to
bind the new identity to an existing network. This must be done by an admin of the existing composer network, i.e. org1

Add a participant record for the admin user for org 2 (bob):

```bash
composer participant add -c alice@ngo -d '{"$class":"org.hyperledger.composer.system.NetworkAdmin", "participantId":"org2-admin"}'
```

Then bind bob's cert (retrieved using the composer identity request above) to the new participant:

```bash
composer identity bind -c alice@ngo -a "resource:org.hyperledger.composer.system.NetworkAdmin#org2-admin" -e bob/admin-pub.pem
```

### As org2

Create a business card that 'bob', the org2 network admin, can use to access the network:

```bash
composer card create -p /tmp/composer/org2/byfn-network-org2.json -u bob -n ngo -c bob/admin-pub.pem -k bob/admin-priv.pem
composer card import -f bob@ngo.card
```

Then ping the network - note that this could take a while as it deploys new chaincode containers. This will FAIL. According 
to this issue, it's to do with the endorsement policy: https://github.com/hyperledger/composer/issues/3858.:

```bash
composer network ping -c bob@ngo
```

### As org1

To fix this, redeploy another version of the bna with the updated endorsement policy. The new policy allows the new org
to endorse transactions. The bna can just be a new version, it doesn't need to include any changes, though it should
have been created using `composer create`, i.e. it can't just be a copy of a previous bna file:

```bash
composer network install --card PeerAdmin@byfn-network-org1 --archiveFile ~/ngo@0.1.37.bna
composer network install --card PeerAdmin@byfn-network-org2 --archiveFile ~/ngo@0.1.37.bna
composer network upgrade -c PeerAdmin@byfn-network-org1 -n ngo -V 0.1.37 -o endorsementPolicyFile=/tmp/composer/endorsement-policy.json
composer network ping -c alice@ngo
composer network ping -c bob@ngo
```

See: https://github.com/hyperledger/composer/issues/3858







## Getting the keys / certs you need to generate the Composer Business Card
As explained in the article https://hyperledger.github.io/composer/latest/tutorials/deploy-to-fabric-multi-org,
you need to obtain the following:

To build the connection profile:

* TLS cert for each peer: /org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
* TLS cert for the orderer: /example.com/orderers/orderer.example.com/tls/ca.crt
* Public cert for the Admin user for each org: crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem
* Private key for the Admin user for each org: crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/*_sk

To create the business card you need three things:

* The connection profile
* The admin users public cert
* The admin users private key

## Upgrading the bna to a new version
After creating the new bna archive using 'composer archive create', copy the bna file to the ubuntu host using scp:

```bash
scp -i ~/Downloads/fabric-composer-ubuntu.pem ngo@0.1.42.bna ubuntu@ec2-34-217-77-198.us-west-2.compute.amazonaws.com:/home/ubuntu
```

Install it and upgrade the network:

```bash
composer network install --card PeerAdmin@byfn-network-org1 --archiveFile ~/ngo@0.1.42.bna
composer network install --card PeerAdmin@byfn-network-org2 --archiveFile ~/ngo@0.1.42.bna
composer network upgrade --card PeerAdmin@byfn-network-org1 -n ngo -V 0.1.42
composer network ping -c alice@ngo
composer network ping -c bob@ngo
```

## Stop Fabric

```bash
./byfn.sh -m down -s couchdb -a
```

## Cleanup

If there are cards in the network, delete them

```bash
composer card delete -c PeerAdmin@byfn-network-org1
composer card delete -c PeerAdmin@byfn-network-org2
composer card delete -c alice@ngo
composer card delete -c bob@ngo
composer card delete -c edge@ngo
composer card delete -c braendle@ngo
```
Remove the composer directory:

```bash
rm -fr $HOME/.composer
rm ~/fabric-samples/first-network/*.card
rm -rf ~/fabric-samples/first-network/alice
rm -rf ~/fabric-samples/first-network/bob
```


## Summary of the artifacts you'll need to complete this process
Some of these artifacts exist in the Fabric network, and some are created during the process:

* TLS certs for the orderer and peers that you will connect to (the peers will be your own peers)
* An admin user in your own organisation, created via your own CA. You'll need the public certificate and the private
key of the admin user

To create the connection profile you will need:

* The endpoints for the orderer, the endorsing peers that you will connect to, and your CA
* The TLS certs for the orderer, the endorsing peers that you will connect to, and your CA

## Troubleshooting
If you find actions against the network fail due to authentication issues, it could be because you have stopped and
restarted the Fabric network. This will cause the certs to be regenerated. However, the business cards in the wallet
(i.e. in the ~/.composer directory) will use the old certs and be invalid. You'll have to remove these (using the cleanup
section above) and recreate them.
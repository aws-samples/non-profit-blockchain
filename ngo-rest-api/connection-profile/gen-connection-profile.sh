
# This script uses the template ngo-connection-profile.json to generate a connection profile
# for the organisations in the Fabric network.

#REPODIR points to this repo.
REPODIR=~/Documents/apps/non-profit-blockchain
#CERTDIR points to the location of the fabric-samples repo. If you are using this to run Fabric, the crypto information
#would have been generated in the balance-transfer/crypto-config folder.
CERTDIR=~/Documents/apps/fabric-samples

# Installing gawk. It should already exist on Linux, but probably not on Mac
# ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)" < /dev/null 2> /dev/null
# brew install gawk

# Update the cert for Org1:
mkdir -p $REPODIR/tmp/connection-profile/org1
mkdir -p $REPODIR/tmp/connection-profile/org2
cp ngo-connection-profile.yaml $REPODIR/tmp/connection-profile
cp client-org1.yaml $REPODIR/tmp/connection-profile/org1
cp client-org2.yaml $REPODIR/tmp/connection-profile/org2

# awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' $CERTDIR/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt > $REPODIR/tmp/connection-profile/org1/ca-org1.txt
# gawk -i inplace -v INPLACE_SUFFIX=.bak 'NR==FNR {cert=$0;next} {gsub("%INSERT_ORG1_CA_CERT%",cert)}1 ' $REPODIR/tmp/connection-profile/org1/ca-org1.txt $REPODIR/tmp/connection-profile/ngo-connection-profile.json

# # Update the cert for Org2:
# awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' $CERTDIR/crypto-config/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt > $REPODIR/tmp/connection-profile/org2/ca-org2.txt
# gawk -i inplace -v INPLACE_SUFFIX=.bak 'NR==FNR {cert=$0;next} {gsub("%INSERT_ORG2_CA_CERT%",cert)}1 ' $REPODIR/tmp/connection-profile/org2/ca-org2.txt $REPODIR/tmp/connection-profile/ngo-connection-profile.json

# # Update the orderer cert:
# awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' $CERTDIR/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt > $REPODIR/tmp/connection-profile/ca-orderer.txt
# gawk -i inplace -v INPLACE_SUFFIX=.bak 'NR==FNR {cert=$0;next} {gsub("%INSERT_ORDERER_CA_CERT%",cert)}1 ' $REPODIR/tmp/connection-profile/ca-orderer.txt $REPODIR/tmp/connection-profile/ngo-connection-profile.json

# # Create connection profile for each org
# sed -e "s/%INSERT_ORG%/Org1/g" -e "s/%INSERT_ORG_LOWERCASE%/org1/g" $REPODIR/tmp/connection-profile/client-ngo-connection-profile.json > $REPODIR/tmp/connection-profile/org1/client-ngo-connection-profile-org1.json
# sed -e "s/%INSERT_ORG%/Org2/g" -e "s/%INSERT_ORG_LOWERCASE%/org2/g" $REPODIR/tmp/connection-profile/client-ngo-connection-profile.json > $REPODIR/tmp/connection-profile/org2/client-ngo-connection-profile-org2.json

if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -e "s|%REPODIR%|$CERTDIR|g" ngo-connection-profile.yaml > $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
else
    sed -i "s|%REPODIR%|$CERTDIR|g"  $REPODIR/tmp/connection-profile/ngo-connection-profile.yaml
fi 

ls -lR $REPODIR/tmp/connection-profile
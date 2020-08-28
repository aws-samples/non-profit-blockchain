#!/bin/bash

print_usage() {
    echo "Usage example:"
    echo "  ./configureAnchorPeer.sh --channelName \"mychannel\" --memberId \"m-JNF6WTCRZJEPTBF6FXLD44KVEM\" --peerAddress \"nd-veqmnn7wfffbhazm4mg4i3fbz4.m-jnf6wtcrzjeptbf6fxld44kvem.n-roc33c2uibfnnbmowgpyi74lfe.managedblockchain.us-east-1.amazonaws.com:30003\" --ordererAddress \"orderer.n-roc33c2uibfnnbmowgpyi74lfe.managedblockchain.us-east-1.amazonaws.com:30001\""
}


while test $# -gt 0; do
  case "$1" in
        --channelName)
            shift
            export CHANNEL_NAME=$1
            shift
            ;;
        --memberId)
            shift
            export AMB_MEMBER_ID=$1
            shift
            ;;
        --peerAddress)
            shift
            export PEER_ADDRESS=$1
            shift
            ;;
        --ordererAddress)
            shift
            export ORDERER=$1
            shift
            ;;
        *)
          break
          ;;
      esac
done

if [ -z "$CHANNEL_NAME" ]
then
    echo "CHANNEL_NAME is not set. Please set it as environment variable CHANNEL_NAME or use \"channelName=\" flag."
    print_usage
    exit 1
fi

if [ -z "$AMB_MEMBER_ID" ]
then
    echo "AMB_MEMBER_ID is not set. Please set it as environment variable AMB_MEMBER_ID or use \"memberId=\" flag."
    print_usage
    exit 1
fi

if [ -z "$PEER_ADDRESS" ]
then
    echo "PEER_ADDRESS is not set. Please set it as environment variable PEER_ADDRESS or use \"peerAddress=\" flag."
    print_usage
    exit 1
fi

if [ -z "$ORDERER" ]
then
    echo "ORDERER is not set. Please set it as environment variable ORDERER or use \"ordererAddress=\" flag."
    print_usage
    exit 1
fi

IFS=: read -r PEER_DNS_NAME PEER_PORT_NUMBER <<< "$PEER_ADDRESS"

echo " "
echo "Initialized with the following config:"
echo "CHANNEL_NAME     : $CHANNEL_NAME";
echo "AMB_MEMBER_ID    : $AMB_MEMBER_ID";
echo "PEER_ADDRESS     : $PEER_ADDRESS";
echo "PEER_DNS_NAME    : $PEER_DNS_NAME";
echo "PEER_PORT_NUMBER : $PEER_PORT_NUMBER";
echo "ORDERER          : $ORDERER";

cd /home/ec2-user

rm-rf ./channel-artifacts && mkdir ./channel-artifacts

docker exec cli peer channel fetch config /opt/home/channel-artifacts/$CHANNEL_NAME.pb -c $CHANNEL_NAME -o $ORDERER --cafile /opt/home/managedblockchain-tls-chain.pem --tls

docker exec cli configtxlator proto_decode --input /opt/home/channel-artifacts/$CHANNEL_NAME.pb --type common.Block --output /opt/home/channel-artifacts/config_block.json

cd channel-artifacts

sudo jq .data.data[0].payload.data.config config_block.json > config.json

cp config.json config_copy.json

jq '.channel_group.groups.Application.groups["'$AMB_MEMBER_ID'"].values += {"AnchorPeers":{"mod_policy": "Admins","value":{"anchor_peers": [{"host": "'$PEER_DNS_NAME'","port": '$PEER_PORT_NUMBER'}]},"version": "0"}}' config_copy.json > modified_config.json

docker exec cli configtxlator proto_encode --input /opt/home/channel-artifacts/config.json --type common.Config --output /opt/home/channel-artifacts/config.pb

docker exec cli configtxlator proto_encode --input /opt/home/channel-artifacts/modified_config.json --type common.Config --output /opt/home/channel-artifacts/modified_config.pb

docker exec cli configtxlator compute_update --channel_id $CHANNEL_NAME --original /opt/home/channel-artifacts/config.pb --updated /opt/home/channel-artifacts/modified_config.pb --output /opt/home/channel-artifacts/config_update.pb

docker exec cli configtxlator proto_decode --input /opt/home/channel-artifacts/config_update.pb --type common.ConfigUpdate --output /opt/home/channel-artifacts/config_update.json

sudo chmod 755 config_update.json

echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL_NAME'", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . > config_update_in_envelope.json

docker exec cli configtxlator proto_encode --input /opt/home/channel-artifacts/config_update_in_envelope.json --type common.Envelope --output /opt/home/channel-artifacts/config_update_in_envelope.pb

docker exec cli peer channel update -f /opt/home/channel-artifacts/config_update_in_envelope.pb -c $CHANNEL_NAME -o $ORDERER --cafile /opt/home/managedblockchain-tls-chain.pem --tls

echo " "
echo "Done"

#2020-08-28 08:37:36.806 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
#2020-08-28 08:37:36.887 UTC [channelCmd] update -> INFO 002 Successfully submitted channel update
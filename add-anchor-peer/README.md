# Script to add Anchor Peer to a channel in Amazon Managed Blockchian for Hyperledger Fabric

This script helps to add an [Anchor Peer](https://hyperledger-fabric.readthedocs.io/en/release-1.4/glossary.html#anchor-peer) 
to a channel in Amazon Managed Blockchain for Hyperledger Fabric network. To set up an EC2 instance with Hyperledger Fabric client and 
create a new channel, please follow the steps in [Getting Started Tutorial](https://docs.aws.amazon.com/managed-blockchain/latest/managementguide/managed-blockchain-get-started-tutorial.html).

## Pre-requisites
 - [An EC2 instance with Hyperledger Fabric client CLI docker container.](https://docs.aws.amazon.com/managed-blockchain/latest/managementguide/get-started-create-client.html)
 - `jq` tool, installed on an EC2 instance with Hyperledger Fabric client CLI.
    To install `jq` tool, run the following command on your EC2 instance: `sudo yum install jq`

## Usage
    ./configureAnchorPeer.sh \
    --channelName "<CHANNEL_NAME>" \
    --memberId "<AMB_MEMBER_ID>" \
    --peerAddress "<PEER_ENDPOINT>" \
    --ordererAddress "<ORDERING_SERVICE_ENDPOINT>"
    
### Usage example:
    ./configureAnchorPeer.sh --channelName "mychannel" --memberId "m-JNF6WTCRZJEPTBF6FXLD44KVEM" --peerAddress "nd-veqmnn7wfffbhazm4mg4i3fbz4.m-jnf6wtcrzjeptbf6fxld44kvem.n-roc33c2uibfnnbmowgpyi74lfe.managedblockchain.us-east-1.amazonaws.com:30003" --ordererAddress "orderer.n-roc33c2uibfnnbmowgpyi74lfe.managedblockchain.us-east-1.amazonaws.com:30001"
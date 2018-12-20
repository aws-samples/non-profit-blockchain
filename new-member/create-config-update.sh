#!/bin/bash

# Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# 
# Licensed under the Apache License, Version 2.0 (the "License").
# You may not use this file except in compliance with the License.
# A copy of the License is located at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# or in the "license" file accompanying this file. This file is distributed 
# on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either 
# express or implied. See the License for the specific language governing 
# permissions and limitations under the License.

region=us-east-1
memberID=m-TRD4XPJBOREM7BDMBV6WLG3NKM
blockDir=/home/ec2-user/fabric-samples/chaincode/hyperledger/fabric/peer

function createConfigUpdate {
   log "Creating config update payload for the new member '$memberID'"

   # Start the configtxlator
   configtxlator start &
   configtxlator_pid=$!
   log "configtxlator_pid:$configtxlator_pid"
   log "Sleeping 5 seconds for configtxlator to start..."
   sleep 5

   pushd /tmp

   CTLURL=http://127.0.0.1:7059
   # Convert the config block protobuf to JSON
   curl -X POST --data-binary @$blockDir/$CHANNEL.config.block $CTLURL/protolator/decode/common.Block > ${memberID}_config_block.json
   # Extract the config from the config block
   jq .data.data[0].payload.data.config ${memberID}_config_block.json > ${memberID}_config.json
 
   isOrgInChannelConfig ${memberID}_config.json
   if [ $? -eq 0 ]; then
        log "Org '$memberID' already exists in the channel config. Config will not be updated. Exiting createConfigUpdate"
        return 1
   fi

   # Append the new org configuration information
   jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'$memberID'":.[1]}}}}}' ${memberID}_config.json ${memberID}.json > ${memberID}_updated_config.json
 
   # Create the config diff protobuf
   curl -X POST --data-binary @${memberID}_config.json $CTLURL/protolator/encode/common.Config > ${memberID}_config.pb
   curl -X POST --data-binary @${memberID}_updated_config.json $CTLURL/protolator/encode/common.Config > ${memberID}_updated_config.pb
   curl -X POST -F original=@${memberID}_config.pb -F updated=@${memberID}_updated_config.pb $CTLURL/configtxlator/compute/update-from-configs -F channel=$CHANNEL_NAME > ${memberID}_config_update.pb

   # Convert the config diff protobuf to JSON
   curl -X POST --data-binary @${memberID}_config_update.pb $CTLURL/protolator/decode/common.ConfigUpdate > ${memberID}_config_update.json

   # Create envelope protobuf container config diff to be used in the "peer channel update" command to update the channel configuration block
   echo '{"payload":{"header":{"channel_header":{"channel_id":"'"${CHANNEL}"'", "type":2}},"data":{"config_update":'$(cat ${memberID}_config_update.json)'}}}' > ${memberID}_config_update_as_envelope.json
   curl -X POST --data-binary @${memberID}_config_update_as_envelope.json $CTLURL/protolator/encode/common.Envelope > /tmp/${memberID}_config_update_as_envelope.pb
   # copy to the /data directory so the file can be signed by other admins
   cp /tmp/${memberID}_config_update_as_envelope.pb $blockDir
 
   # Stop configtxlator
   kill $configtxlator_pid
   log "Created config update payload for the new organization '$memberID', in file /${blockDir}/${memberID}_config_update_as_envelope.pb"

   popd
   return 0
}

createConfigUpdate

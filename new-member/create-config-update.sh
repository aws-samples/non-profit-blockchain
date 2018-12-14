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

function createConfigUpdate {
   log "Creating config update payload for the new member '$NEW_ORG'"
   
   # Start the configtxlator
   configtxlator start &
   configtxlator_pid=$!
   log "configtxlator_pid:$configtxlator_pid"
   log "Sleeping 5 seconds for configtxlator to start..."
   sleep 5

   pushd /tmp

   #make a copy of the .json files below
   jsonbkdir=/$DATA/addorg-${NEW_ORG}-`date +%Y%m%d-%H%M`
   mkdir $jsonbkdir

   CTLURL=http://127.0.0.1:7059
   # Convert the config block protobuf to JSON
   curl -X POST --data-binary @$CONFIG_BLOCK_FILE $CTLURL/protolator/decode/common.Block > ${NEW_ORG}_config_block.json
   # Extract the config from the config block
   jq .data.data[0].payload.data.config ${NEW_ORG}_config_block.json > ${NEW_ORG}_config.json
   sudo cp ${NEW_ORG}_config_block.json $jsonbkdir
   sudo cp ${NEW_ORG}_config.json $jsonbkdir

   isOrgInChannelConfig ${NEW_ORG}_config.json
   if [ $? -eq 0 ]; then
        log "Org '$NEW_ORG' already exists in the channel config. Config will not be updated. Exiting createConfigUpdate"
        return 1
   fi

   # Append the new org configuration information
   jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'$NEW_ORG'":.[1]}}}}}' ${NEW_ORG}_config.json ${NEW_ORG}.json > ${NEW_ORG}_updated_config.json
   # copy the block config to the /data directory in case we need to update it with another config change later
   cp /tmp/${NEW_ORG}_updated_config.json $jsonbkdir

   # Create the config diff protobuf
   curl -X POST --data-binary @${NEW_ORG}_config.json $CTLURL/protolator/encode/common.Config > ${NEW_ORG}_config.pb
   curl -X POST --data-binary @${NEW_ORG}_updated_config.json $CTLURL/protolator/encode/common.Config > ${NEW_ORG}_updated_config.pb
   curl -X POST -F original=@${NEW_ORG}_config.pb -F updated=@${NEW_ORG}_updated_config.pb $CTLURL/configtxlator/compute/update-from-configs -F channel=$CHANNEL_NAME > ${NEW_ORG}_config_update.pb

   # Convert the config diff protobuf to JSON
   curl -X POST --data-binary @${NEW_ORG}_config_update.pb $CTLURL/protolator/decode/common.ConfigUpdate > ${NEW_ORG}_config_update.json
   cp /tmp/${NEW_ORG}_config_update.json $jsonbkdir

   # Create envelope protobuf container config diff to be used in the "peer channel update" command to update the channel configuration block
   echo '{"payload":{"header":{"channel_header":{"channel_id":"'"${CHANNEL_NAME}"'", "type":2}},"data":{"config_update":'$(cat ${NEW_ORG}_config_update.json)'}}}' > ${NEW_ORG}_config_update_as_envelope.json
   curl -X POST --data-binary @${NEW_ORG}_config_update_as_envelope.json $CTLURL/protolator/encode/common.Envelope > /tmp/${NEW_ORG}_config_update_as_envelope.pb
   # copy to the /data directory so the file can be signed by other admins
   cp /tmp/${NEW_ORG}_config_update_as_envelope.pb /$DATA
   cp /tmp/${NEW_ORG}_config_update_as_envelope.pb $jsonbkdir
   cp /tmp/${NEW_ORG}_config_update_as_envelope.json $jsonbkdir
   ls -lt $jsonbkdir

   # Stop configtxlator
   kill $configtxlator_pid
   log "Created config update payload for the new organization '$NEW_ORG', in file /${DATA}/${NEW_ORG}_config_update_as_envelope.pb"

   popd
   return 0
}

createConfigUpdate

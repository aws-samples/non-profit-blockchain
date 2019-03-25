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
   echo "Creating config update payload for the new member '$MEMBERID'"
   cd /opt/home

   # Start the configtxlator
   configtxlator start &
   configtxlator_pid=$!
   echo "configtxlator_pid:$configtxlator_pid"
   echo "Sleeping 5 seconds for configtxlator to start..."
   sleep 5

   pushd /tmp
   # Remove any previously generated config or protobuf files
   rm /tmp/${MEMBERID}_config*.*
   rm /tmp/${MEMBERID}_updated*.*
   
   CTLURL=http://127.0.0.1:7059
   # Convert the config block protobuf to JSON
   curl -X POST --data-binary @$BLOCKDIR/$CHANNEL.config.block $CTLURL/protolator/decode/common.Block > ${MEMBERID}_config_block.json
   # Extract the config from the config block
   jq .data.data[0].payload.data.config ${MEMBERID}_config_block.json > ${MEMBERID}_config.json
 
   isMemberInChannelConfig ${MEMBERID}_config.json
   if [ $? -eq 0 ]; then
        echo "Member '$MEMBERID' already exists in the channel config. Config will not be updated. Exiting createConfigUpdate"
        return 1
   fi

   # Append the new org configuration information
   jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"'$MEMBERID'":.[1]}}}}}' ${MEMBERID}_config.json ${MEMBERID}.json > ${MEMBERID}_updated_config.json
 
   # Create the config diff protobuf
   curl -X POST --data-binary @${MEMBERID}_config.json $CTLURL/protolator/encode/common.Config > ${MEMBERID}_config.pb
   curl -X POST --data-binary @${MEMBERID}_updated_config.json $CTLURL/protolator/encode/common.Config > ${MEMBERID}_updated_config.pb
   curl -X POST -F original=@${MEMBERID}_config.pb -F updated=@${MEMBERID}_updated_config.pb $CTLURL/configtxlator/compute/update-from-configs -F channel=$CHANNEL > ${MEMBERID}_config_update.pb

   # Convert the config diff protobuf to JSON
   curl -X POST --data-binary @${MEMBERID}_config_update.pb $CTLURL/protolator/decode/common.ConfigUpdate > ${MEMBERID}_config_update.json

   # Create envelope protobuf container config diff to be used in the "peer channel update" command to update the channel configuration block
   echo '{"payload":{"header":{"channel_header":{"channel_id":"'"${CHANNEL}"'", "type":2}},"data":{"config_update":'$(cat ${MEMBERID}_config_update.json)'}}}' > ${MEMBERID}_config_update_as_envelope.json
   curl -X POST --data-binary @${MEMBERID}_config_update_as_envelope.json $CTLURL/protolator/encode/common.Envelope > /tmp/${MEMBERID}_config_update_as_envelope.pb
   # copy to the /data directory so the file can be signed by other admins
   cp /tmp/${MEMBERID}_config_update_as_envelope.pb $BLOCKDIR
 
   # Stop configtxlator
   kill $configtxlator_pid
   echo "Created config update payload for the new organization '$MEMBERID', in file ${BLOCKDIR}/${MEMBERID}_config_update_as_envelope.pb"

   popd
   return 0
}

# Checks whether the new member already exists in the channel config. This would be true if the member has already been added
# to the channel config
function isMemberInChannelConfig {
    if [ $# -ne 1 ]; then
        echo "Usage: isMemberInChannelConfig <Config JSON file>"
        exit 1
    fi
    echo "Checking whether member '$MEMBERID' already exists in the channel config"
    local JSONFILE=$1

    # check if the member exists in the channel config
    echo "About to execute jq '.channel_group.groups.Application.groups | contains({$MEMBERID})'"
    if cat ${JSONFILE} | jq -e ".channel_group.groups.Application.groups | contains({\"$MEMBERID\"})" > /dev/null; then
        echo "Member '$MEMBERID' already exists in the channel config"
        return 0
    else
        echo "Member '$MEMBERID' does not exist in the channel config. This is expected as we are about to add the member"
        return 1
    fi
}

createConfigUpdate

/*
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
#
*/

const log4j = require('log4js');
const config = require("./config");
const chaincodeListener = require('./chaincodelistener.js');

logger = log4j.getLogger('Server');
logger.level = config.logLevel;

const FABRIC_USERNAME = config.fabricUsername;
const CHANNEL_NAME = config.channelName;

async function run() {
  try {
    await chaincodeListener.startListener(CHANNEL_NAME, FABRIC_USERNAME);
  } catch (error) {
    logger.error('##### FabricEventListener - Terminating because we caught an error: ', error);
    process.exit(1);
  }
}

if (require.main === module) {
  run()
} else {
	module.exports.run = run;
}
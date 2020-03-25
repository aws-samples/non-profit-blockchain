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

const AWS = require('aws-sdk');
const config = require("./config");
const logger = require("./logging").getLogger("queue");

/**
  event: {
    transactionId: event.tx_id,
    chaincode: event.chaincode_id,
    name: event.event_name,
    payload: "" + event.payload
  }
*/
async function putEvent(event) {
  const sqsClient = new AWS.SQS({
    region: "us-east-1",
    apiVersion: '2012-11-05'
  });

  const params = {};
  const payloadJSON = JSON.parse(event.payload);

  const MessageBody = {
    type: event.name,
    transactionId: event.transactionId,
    donationAmount: payloadJSON.donationAmount,
    ngoRegistrationNumber: payloadJSON.ngoRegistrationNumber,
    createdBy: payloadJSON.createdBy,
    createdAt: payloadJSON.createdAt
  }
  params['MessageBody'] = JSON.stringify(MessageBody);
  params['QueueUrl'] = config.SQSQueueURL;

  await sqsClient.sendMessage(params).promise();
  logger.info(`##### queue - putEvent '${event.name}'`);
}

module.exports = { putEvent };
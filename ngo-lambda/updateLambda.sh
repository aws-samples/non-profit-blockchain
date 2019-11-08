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

# This script is used to update an existing Lambda function.
zip -r /tmp/ngo-lambda-function.zip ~/non-profit-blockchain/ngo-lambda/src/

aws lambda update-function-code --function-name ngo-lambda-function --zip-file fileb:///tmp/ngo-lambda-function.zip --region $REGION
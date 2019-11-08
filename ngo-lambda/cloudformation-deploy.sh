#!/bin/bash
export LAMBDA_STACK_NAME=fabric-lambda-stack
export VPC_STACK_NAME=$NETWORKNAME-fabric-client-node

# Deploy the Lambda
aws cloudformation deploy --stack-name $LAMBDA_STACK_NAME --template-file cloudformation-lambda.yaml \
--capabilities CAPABILITY_NAMED_IAM \
--parameter-overrides CAENDPOINT=$CASERVICEENDPOINT PEERENDPOINT=grpcs://$PEERSERVICEENDPOINT \
ORDERERENDPOINT=grpcs://$ORDERINGSERVICEENDPOINT CHANNELNAME=$CHANNEL \
CHAINCODEID=$CHAINCODEID MSP=$MSP MEMBERNAME=$MEMBERNAME \
SECURITYGROUPID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='SecurityGroupID'].OutputValue" --output text --region $REGION ) \
 SUBNETID=$(aws cloudformation describe-stacks --stack-name $VPC_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PublicSubnetID'].OutputValue" --output text --region $REGION ) --region $REGION

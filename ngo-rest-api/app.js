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

'use strict';
var log4js = require('log4js');
log4js.configure({
	appenders: {
	  out: { type: 'stdout' },
	},
	categories: {
	  default: { appenders: ['out'], level: 'info' },
	}
});
var logger = log4js.getLogger('NGOAPI');
const WebSocketServer = require('ws');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
var cors = require('cors');
var hfc = require('fabric-client');
const uuidv4 = require('uuid/v4');

var connection = require('./connection.js');
var query = require('./query.js');
var invoke = require('./invoke.js');
var blockListener = require('./blocklistener.js');

hfc.addConfigFile('config.json');
var host = 'localhost';
var port = 3000;
var username = "";
var orgName = "";
var channelName = hfc.getConfigSetting('channelName');
var chaincodeName = hfc.getConfigSetting('chaincodeName');
var peers = hfc.getConfigSetting('peers');
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATIONS ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(function(req, res, next) {
	logger.info(' ##### New request for URL %s',req.originalUrl);
	return next();
});

//wrapper to handle errors thrown by async functions. We can catch all
//errors thrown by async functions in a single place, here in this function,
//rather than having a try-catch in every function below. The 'next' statement
//used here will invoke the error handler function - see the end of this script
const awaitHandler = (fn) => {
	return async (req, res, next) => {
		try {
			await fn(req, res, next)
		} 
		catch (err) {
			next(err)
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, function() {});
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  Listening on: http://%s:%s  ******************',host,port);
server.timeout = 240000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START WEBSOCKET SERVER ///////////////////////
///////////////////////////////////////////////////////////////////////////////
const wss = new WebSocketServer.Server({ server });
wss.on('connection', function connection(ws) {
	logger.info('****************** WEBSOCKET SERVER - received connection ************************');
	ws.on('message', function incoming(message) {
		console.log('##### Websocket Server received message: %s', message);
	});

	ws.send('something');
});

///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////
// Health check - can be called by load balancer to check health of REST API
app.get('/health', awaitHandler(async (req, res) => {
	res.sendStatus(200);
}));

// Register and enroll user. A user must be registered and enrolled before any queries 
// or transactions can be invoked
app.post('/users', awaitHandler(async (req, res) => {
	logger.info('================ POST on Users');
	username = req.body.username;
	orgName = req.body.orgName;
	logger.info('##### End point : /users');
	logger.info('##### POST on Users- username : ' + username);
	logger.info('##### POST on Users - userorg  : ' + orgName);
	let response = await connection.getRegisteredUser(username, orgName, true);
	logger.info('##### POST on Users - returned from registering the username %s for organization %s', username, orgName);
    logger.info('##### POST on Users - getRegisteredUser response secret %s', response.secret);
    logger.info('##### POST on Users - getRegisteredUser response secret %s', response.message);
    if (response && typeof response !== 'string') {
        logger.info('##### POST on Users - Successfully registered the username %s for organization %s', username, orgName);
		logger.info('##### POST on Users - getRegisteredUser response %s', response);
		// Now that we have a username & org, we can start the block listener
		await blockListener.startBlockListener(channelName, username, orgName, wss);
		res.json(response);
	} else {
		logger.error('##### POST on Users - Failed to register the username %s for organization %s with::%s', username, orgName, response);
		res.json({success: false, message: response});
	}
}));

/************************************************************************************
 * Donor methods
 ************************************************************************************/

// GET Donor
app.get('/donors', awaitHandler(async (req, res) => {
	logger.info('================ GET on Donor');
	let args = {};
	let fcn = "queryAllDonors";

    logger.info('##### GET on Donor - username : ' + username);
	logger.info('##### GET on Donor - userOrg : ' + orgName);
	logger.info('##### GET on Donor - channelName : ' + channelName);
	logger.info('##### GET on Donor - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Donor - fcn : ' + fcn);
	logger.info('##### GET on Donor - args : ' + JSON.stringify(args));
	logger.info('##### GET on Donor - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific Donor
app.get('/donors/:donorUserName', awaitHandler(async (req, res) => {
	logger.info('================ GET on Donor by ID');
	logger.info('Donor username : ' + req.params);
	let args = req.params;
	let fcn = "queryDonor";

    logger.info('##### GET on Donor by username - username : ' + username);
	logger.info('##### GET on Donor by username - userOrg : ' + orgName);
	logger.info('##### GET on Donor by username - channelName : ' + channelName);
	logger.info('##### GET on Donor by username - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Donor by username - fcn : ' + fcn);
	logger.info('##### GET on Donor by username - args : ' + JSON.stringify(args));
	logger.info('##### GET on Donor by username - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET the Donations for a specific Donor
app.get('/donors/:donorUserName/donations', awaitHandler(async (req, res) => {
	logger.info('================ GET on Donations for Donor');
	logger.info('Donor username : ' + req.params);
	let args = req.params;
	let fcn = "queryDonationsForDonor";

    logger.info('##### GET on Donations for Donor - username : ' + username);
	logger.info('##### GET on Donations for Donor - userOrg : ' + orgName);
	logger.info('##### GET on Donations for Donor - channelName : ' + channelName);
	logger.info('##### GET on Donations for Donor - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Donations for Donor - fcn : ' + fcn);
	logger.info('##### GET on Donations for Donor - args : ' + JSON.stringify(args));
	logger.info('##### GET on Donations for Donor - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// POST Donor
app.post('/donors', awaitHandler(async (req, res) => {
	logger.info('================ POST on Donor');
	var args = req.body;
	var fcn = "createDonor";

    logger.info('##### POST on Donor - username : ' + username);
	logger.info('##### POST on Donor - userOrg : ' + orgName);
	logger.info('##### POST on Donor - channelName : ' + channelName);
	logger.info('##### POST on Donor - chaincodeName : ' + chaincodeName);
	logger.info('##### POST on Donor - fcn : ' + fcn);
	logger.info('##### POST on Donor - args : ' + JSON.stringify(args));
	logger.info('##### POST on Donor - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

/************************************************************************************
 * NGO methods
 ************************************************************************************/

// GET NGO
app.get('/ngos', awaitHandler(async (req, res) => {
	logger.info('================ GET on NGO');
	let args = {};
	let fcn = "queryAllNGOs";

    logger.info('##### GET on NGO - username : ' + username);
	logger.info('##### GET on NGO - userOrg : ' + orgName);
	logger.info('##### GET on NGO - channelName : ' + channelName);
	logger.info('##### GET on NGO - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on NGO - fcn : ' + fcn);
	logger.info('##### GET on NGO - args : ' + JSON.stringify(args));
	logger.info('##### GET on NGO - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific NGO
app.get('/ngos/:ngoRegistrationNumber', awaitHandler(async (req, res) => {
	logger.info('================ GET on NGO by ID');
	logger.info('NGO ngoRegistrationNumber : ' + req.params);
	let args = req.params;
	let fcn = "queryNGO";

    logger.info('##### GET on NGO - username : ' + username);
	logger.info('##### GET on NGO - userOrg : ' + orgName);
	logger.info('##### GET on NGO - channelName : ' + channelName);
	logger.info('##### GET on NGO - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on NGO - fcn : ' + fcn);
	logger.info('##### GET on NGO - args : ' + JSON.stringify(args));
	logger.info('##### GET on NGO - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET the Donations for a specific NGO
app.get('/ngos/:ngoRegistrationNumber/donations', awaitHandler(async (req, res) => {
	logger.info('================ GET on Donations for NGO');
	logger.info('NGO ngoRegistrationNumber : ' + req.params);
	let args = req.params;
	let fcn = "queryDonationsForNGO";

    logger.info('##### GET on Donations for NGO - username : ' + username);
	logger.info('##### GET on Donations for NGO - userOrg : ' + orgName);
	logger.info('##### GET on Donations for NGO - channelName : ' + channelName);
	logger.info('##### GET on Donations for NGO - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Donations for NGO - fcn : ' + fcn);
	logger.info('##### GET on Donations for NGO - args : ' + JSON.stringify(args));
	logger.info('##### GET on Donations for NGO - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET the Spend for a specific NGO
app.get('/ngos/:ngoRegistrationNumber/spend', awaitHandler(async (req, res) => {
	logger.info('================ GET on Spend for NGO');
	logger.info('NGO ngoRegistrationNumber : ' + req.params);
	let args = req.params;
	let fcn = "querySpendForNGO";

    logger.info('##### GET on Spend for NGO - username : ' + username);
	logger.info('##### GET on Spend for NGO - userOrg : ' + orgName);
	logger.info('##### GET on Spend for NGO - channelName : ' + channelName);
	logger.info('##### GET on Spend for NGO - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Spend for NGO - fcn : ' + fcn);
	logger.info('##### GET on Spend for NGO - args : ' + JSON.stringify(args));
	logger.info('##### GET on Spend for NGO - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET the Ratings for a specific NGO
app.get('/ngos/:ngoRegistrationNumber/ratings', awaitHandler(async (req, res) => {
	logger.info('================ GET on Ratings for NGO');
	logger.info('NGO ngoRegistrationNumber : ' + req.params);
	let args = req.params;
	let fcn = "queryRatingsForNGO";

    logger.info('##### GET on Ratings for NGO - username : ' + username);
	logger.info('##### GET on Ratings for NGO - userOrg : ' + orgName);
	logger.info('##### GET on Ratings for NGO - channelName : ' + channelName);
	logger.info('##### GET on Ratings for NGO - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Ratings for NGO - fcn : ' + fcn);
	logger.info('##### GET on Ratings for NGO - args : ' + JSON.stringify(args));
	logger.info('##### GET on Ratings for NGO - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// POST NGO
app.post('/ngos', awaitHandler(async (req, res) => {
	logger.info('================ POST on NGO');
	var args = req.body;
	var fcn = "createNGO";

    logger.info('##### POST on NGO - username : ' + username);
	logger.info('##### POST on NGO - userOrg : ' + orgName);
	logger.info('##### POST on NGO - channelName : ' + channelName);
	logger.info('##### POST on NGO - chaincodeName : ' + chaincodeName);
	logger.info('##### POST on NGO - fcn : ' + fcn);
	logger.info('##### POST on NGO - args : ' + JSON.stringify(args));
	logger.info('##### POST on NGO - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

/************************************************************************************
 * Donation methods
 ************************************************************************************/

// GET Donation
app.get('/donations', awaitHandler(async (req, res) => {
	logger.info('================ GET on Donation');
	let args = {};
	let fcn = "queryAllDonations";

    logger.info('##### GET on Donation - username : ' + username);
	logger.info('##### GET on Donation - userOrg : ' + orgName);
	logger.info('##### GET on Donation - channelName : ' + channelName);
	logger.info('##### GET on Donation - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Donation - fcn : ' + fcn);
	logger.info('##### GET on Donation - args : ' + JSON.stringify(args));
	logger.info('##### GET on Donation - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific Donation
app.get('/donations/:donationId', awaitHandler(async (req, res) => {
	logger.info('================ GET on Donation by ID');
	logger.info('Donation ID : ' + req.params);
	let args = req.params;
	let fcn = "queryDonation";

    logger.info('##### GET on Donation - username : ' + username);
	logger.info('##### GET on Donation - userOrg : ' + orgName);
	logger.info('##### GET on Donation - channelName : ' + channelName);
	logger.info('##### GET on Donation - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Donation - fcn : ' + fcn);
	logger.info('##### GET on Donation - args : ' + JSON.stringify(args));
	logger.info('##### GET on Donation - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET the SpendAllocation records for a specific Donation
app.get('/donations/:donationId/spendallocations', awaitHandler(async (req, res) => {
	logger.info('================ GET on SpendAllocation for Donation');
	logger.info('Donation ID : ' + req.params);
	let args = req.params;
	let fcn = "querySpendAllocationForDonation";

    logger.info('##### GET on SpendAllocation for Donation - username : ' + username);
	logger.info('##### GET on SpendAllocation for Donation - userOrg : ' + orgName);
	logger.info('##### GET on SpendAllocation for Donation - channelName : ' + channelName);
	logger.info('##### GET on SpendAllocation for Donation - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on SpendAllocation for Donation - fcn : ' + fcn);
	logger.info('##### GET on SpendAllocation for Donation - args : ' + JSON.stringify(args));
	logger.info('##### GET on SpendAllocation for Donation - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// POST Donation
app.post('/donations', awaitHandler(async (req, res) => {
	logger.info('================ POST on Donation');
	var args = req.body;
	var fcn = "createDonation";

    logger.info('##### POST on Donation - username : ' + username);
	logger.info('##### POST on Donation - userOrg : ' + orgName);
	logger.info('##### POST on Donation - channelName : ' + channelName);
	logger.info('##### POST on Donation - chaincodeName : ' + chaincodeName);
	logger.info('##### POST on Donation - fcn : ' + fcn);
	logger.info('##### POST on Donation - args : ' + JSON.stringify(args));
	logger.info('##### POST on Donation - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

/************************************************************************************
 * Spend methods
 ************************************************************************************/

// GET Spend
app.get('/spend', awaitHandler(async (req, res) => {
	logger.info('================ GET on Spend');
	let args = {};
	let fcn = "queryAllSpend";

    logger.info('##### GET on Spend - username : ' + username);
	logger.info('##### GET on Spend - userOrg : ' + orgName);
	logger.info('##### GET on Spend - channelName : ' + channelName);
	logger.info('##### GET on Spend - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Spend - fcn : ' + fcn);
	logger.info('##### GET on Spend - args : ' + JSON.stringify(args));
	logger.info('##### GET on Spend - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific Spend
app.get('/spend/:spendId', awaitHandler(async (req, res) => {
	logger.info('================ GET on Spend by ID');
	logger.info('Spend ID : ' + req.params);
	let args = req.params;
	let fcn = "querySpend";

    logger.info('##### GET on Spend - username : ' + username);
	logger.info('##### GET on Spend - userOrg : ' + orgName);
	logger.info('##### GET on Spend - channelName : ' + channelName);
	logger.info('##### GET on Spend - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Spend - fcn : ' + fcn);
	logger.info('##### GET on Spend - args : ' + JSON.stringify(args));
	logger.info('##### GET on Spend - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET the SpendAllocation records for a specific Spend
app.get('/spend/:spendId/spendallocations', awaitHandler(async (req, res) => {
	logger.info('================ GET on SpendAllocation for Spend');
	logger.info('Donation ID : ' + req.params);
	let args = req.params;
	let fcn = "querySpendAllocationForSpend";

    logger.info('##### GET on SpendAllocation for Spend - username : ' + username);
	logger.info('##### GET on SpendAllocation for Spend - userOrg : ' + orgName);
	logger.info('##### GET on SpendAllocation for Spend - channelName : ' + channelName);
	logger.info('##### GET on SpendAllocation for Spend - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on SpendAllocation for Spend - fcn : ' + fcn);
	logger.info('##### GET on SpendAllocation for Spend - args : ' + JSON.stringify(args));
	logger.info('##### GET on SpendAllocation for Spend - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));


// POST Spend
app.post('/spend', awaitHandler(async (req, res) => {
	logger.info('================ dummySpend');
	var args = req.body;
	var fcn = "createSpend";

    logger.info('##### dummySpend - username : ' + username);
	logger.info('##### dummySpend - userOrg : ' + orgName);
	logger.info('##### dummySpend - channelName : ' + channelName);
	logger.info('##### dummySpend - chaincodeName : ' + chaincodeName);
	logger.info('##### dummySpend - fcn : ' + fcn);
	logger.info('##### dummySpend - args : ' + JSON.stringify(args));
	logger.info('##### dummySpend - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

/************************************************************************************
 * SpendAllocation methods
 ************************************************************************************/

// GET all SpendAllocation records
app.get('/spendallocations', awaitHandler(async (req, res) => {
	logger.info('================ GET on spendAllocation');
	let args = {};
	let fcn = "queryAllSpendAllocations";

	logger.info('##### GET on spendAllocationForDonation - username : ' + username);
	logger.info('##### GET on spendAllocationForDonation - userOrg : ' + orgName);
	logger.info('##### GET on spendAllocationForDonation - channelName : ' + channelName);
	logger.info('##### GET on spendAllocationForDonation - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on spendAllocationForDonation - fcn : ' + fcn);
	logger.info('##### GET on spendAllocationForDonation - args : ' + JSON.stringify(args));
	logger.info('##### GET on spendAllocationForDonation - peers : ' + peers);

	let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

/************************************************************************************
 * Ratings methods
 ************************************************************************************/

 // POST Rating
app.post('/ratings', awaitHandler(async (req, res) => {
	logger.info('================ POST on Ratings');
	var args = req.body;
	var fcn = "createRating";

    logger.info('##### POST on Ratings - username : ' + username);
	logger.info('##### POST on Ratings - userOrg : ' + orgName);
	logger.info('##### POST on Ratings - channelName : ' + channelName);
	logger.info('##### POST on Ratings - chaincodeName : ' + chaincodeName);
	logger.info('##### POST on Ratings - fcn : ' + fcn);
	logger.info('##### POST on Ratings - args : ' + JSON.stringify(args));
	logger.info('##### POST on Ratings - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

// GET a specific Rating
app.get('/ratings/:ngoRegistrationNumber/:donorUserName', awaitHandler(async (req, res) => {
	logger.info('================ GET on Rating by ID');
	logger.info('Rating ID : ' + util.inspect(req.params));
	let args = req.params;
	let fcn = "queryDonorRatingsForNGO";

    logger.info('##### GET on Rating - username : ' + username);
	logger.info('##### GET on Rating - userOrg : ' + orgName);
	logger.info('##### GET on Rating - channelName : ' + channelName);
	logger.info('##### GET on Rating - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on Rating - fcn : ' + fcn);
	logger.info('##### GET on Rating - args : ' + JSON.stringify(args));
	logger.info('##### GET on Rating - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

/************************************************************************************
 * Blockchain metadata methods
 ************************************************************************************/

// GET details of a blockchain transaction using the record key (i.e. the key used to store the transaction
// in the world state)
app.get('/blockinfos/:docType/keys/:key', awaitHandler(async (req, res) => {
	logger.info('================ GET on blockinfo');
	logger.info('Key is : ' + req.params);
	let args = req.params;
	let fcn = "queryHistoryForKey";
	
	logger.info('##### GET on blockinfo - username : ' + username);
	logger.info('##### GET on blockinfo - userOrg : ' + orgName);
	logger.info('##### GET on blockinfo - channelName : ' + channelName);
	logger.info('##### GET on blockinfo - chaincodeName : ' + chaincodeName);
	logger.info('##### GET on blockinfo - fcn : ' + fcn);
	logger.info('##### GET on blockinfo - args : ' + JSON.stringify(args));
	logger.info('##### GET on blockinfo - peers : ' + peers);

	let history = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	logger.info('##### GET on blockinfo - queryHistoryForKey : ' + util.inspect(history));
	res.send(history);
}));


/************************************************************************************
 * Utility function for creating dummy spend records. Mimics the behaviour of an NGO
 * spending funds, which are allocated against donations
 ************************************************************************************/

async function dummySpend() {
	if (!username) {
		return;
	}
	// first, we get a list of donations and randomly choose one
	let args = {};
	let fcn = "queryAllDonations";

    logger.info('##### dummySpend GET on Donation - username : ' + username);
	logger.info('##### dummySpend GET on Donation - userOrg : ' + orgName);
	logger.info('##### dummySpend GET on Donation - channelName : ' + channelName);
	logger.info('##### dummySpend GET on Donation - chaincodeName : ' + chaincodeName);
	logger.info('##### dummySpend GET on Donation - fcn : ' + fcn);
	logger.info('##### dummySpend GET on Donation - args : ' + JSON.stringify(args));
	logger.info('##### dummySpend GET on Donation - peers : ' + peers);

	let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	let len = message.length;
	if (len < 1) {
		logger.info('##### dummySpend - no donations available');
	}
	logger.info('##### dummySpend - number of donation record: ' + len);
	if (len < 1) {
		return;
	}
	let ran = Math.floor(Math.random() * len);
	logger.info('##### dummySpend - randomly selected donation record number: ' + ran);
	logger.info('##### dummySpend - randomly selected donation record: ' + JSON.stringify(message[ran]));
	let ngo = message[ran]['ngoRegistrationNumber'];
	logger.info('##### dummySpend - randomly selected ngo: ' + ngo);

	// then we create a spend record for the NGO that received the donation
	fcn = "createSpend";
	let spendId = uuidv4();
	let spendAmt = Math.floor(Math.random() * 100) + 1;

	args = {};
	args["ngoRegistrationNumber"] = ngo;
	args["spendId"] = spendId;
	args["spendDescription"] = "Peter Pipers Poulty Portions for Pets";
	args["spendDate"] = "2018-09-20T12:41:59.582Z";
	args["spendAmount"] = spendAmt;

	logger.info('##### dummySpend - username : ' + username);
	logger.info('##### dummySpend - userOrg : ' + orgName);
	logger.info('##### dummySpend - channelName : ' + channelName);
	logger.info('##### dummySpend - chaincodeName : ' + chaincodeName);
	logger.info('##### dummySpend - fcn : ' + fcn);
	logger.info('##### dummySpend - args : ' + JSON.stringify(args));
	logger.info('##### dummySpend - peers : ' + peers);

	message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
}

(function loop() {
    var rand = Math.round(Math.random() * (20000 - 5000)) + 5000;
    setTimeout(function() {
		dummySpend();
        loop();  
    }, rand);
}());

/************************************************************************************
 * Error handler
 ************************************************************************************/

app.use(function(error, req, res, next) {
	res.status(500).json({ error: error.toString() });
});


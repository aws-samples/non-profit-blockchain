/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
var log4js = require('log4js');
log4js.configure({
	appenders: {
	  out: { type: 'stdout' },
	},
	categories: {
	  default: { appenders: ['out'], level: 'debug' },
	}
});
var logger = log4js.getLogger('ngo-rest-api');
const WebSocketServer = require('ws');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
var cors = require('cors');

var hfc = require('fabric-client');

var helper = require('./helper.js');
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
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
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
logger.info('***************  http://%s:%s  ******************',host,port);
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
// Health check
app.get('/health', awaitHandler(async (req, res) => {
	res.sendStatus(200);
}));

// Register and enroll user. A user must be registered and enrolled before any queries 
// or transactions can be invoked
app.post('/users', awaitHandler(async (req, res) => {
	username = req.body.username;
	orgName = req.body.orgName;
	logger.info('##### End point : /users');
	logger.info('##### End point : /users - User name : ' + username);
	logger.info('##### End point : /users - Org name  : ' + orgName);
	if (!username) {
		res.json(getErrorMessage('\'username\''));
		return;
	}
	if (!orgName) {
		res.json(getErrorMessage('\'orgName\''));
		return;
	}
	let response = await helper.getRegisteredUser(username, orgName, true);
	logger.info('##### End point : /users - returned from registering the username %s for organization %s',username,orgName);
    logger.info('##### End point : /users - getRegisteredUser response secret %s',response.secret);
    logger.info('##### End point : /users - getRegisteredUser response secret %s',response.message);
    if (response && typeof response !== 'string') {
        logger.info('##### End point : /users - Successfully registered the username %s for organization %s',username,orgName);
		logger.info('##### End point : /users - getRegisteredUser response %s',response);
		// Now that we have a username & org, we can start the block listener
		await blockListener.startBlockListener(channelName, username, orgName, wss);
		res.json(response);
	} else {
		logger.error('##### End point : /users - Failed to register the username %s for organization %s with::%s',username,orgName,response);
		res.json({success: false, message: response});
	}
}));
// Query on chaincode on target peers
app.get('/channels/:channelName/chaincodes/:chaincodeName', awaitHandler(async (req, res) => {
	logger.info('==================== QUERY BY CHAINCODE ==================');
	var channelName = req.params.channelName;
	var chaincodeName = req.params.chaincodeName;
	let args = req.query.args;
	let fcn = req.query.fcn;
	let peer = req.query.peer;

	logger.info('channelName : ' + channelName);
	logger.info('chaincodeName : ' + chaincodeName);
	logger.info('fcn : ' + fcn);
	logger.info('args : ' + args);

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}
	args = args.replace(/'/g, '"');
	args = JSON.parse(args);
	logger.info(args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));
//  Query Get Block by BlockNumber
app.get('/channels/:channelName/blocks/:blockId', awaitHandler(async (req, res) => {
	logger.info('==================== GET BLOCK BY NUMBER ==================');
	let blockId = req.params.blockId;
	let peer = req.query.peer;
	logger.info('channelName : ' + req.params.channelName);
	logger.info('BlockID : ' + blockId);
	logger.info('Peer : ' + peer);
	if (!blockId) {
		res.json(getErrorMessage('\'blockId\''));
		return;
	}

	let message = await query.getBlockByNumber(peer, req.params.channelName, blockId, username, orgName);
	res.send(message);
}));
// Query Get Transaction by Transaction ID
app.get('/channels/:channelName/transactions/:trxnId', awaitHandler(async (req, res) => {
	logger.info('================ GET TRANSACTION BY TRANSACTION_ID ======================');
	logger.info('channelName : ' + req.params.channelName);
	let trxnId = req.params.trxnId;
	let peer = req.query.peer;
	if (!trxnId) {
		res.json(getErrorMessage('\'trxnId\''));
		return;
	}

	let message = await query.getTransactionByID(peer, req.params.channelName, trxnId, username, orgName);
	res.send(message);
}));
// Query Get Block by Hash
app.get('/channels/:channelName/blocks', awaitHandler(async (req, res) => {
	logger.info('================ GET BLOCK BY HASH ======================');
	logger.info('channelName : ' + req.params.channelName);
	let hash = req.query.hash;
	let peer = req.query.peer;
	if (!hash) {
		res.json(getErrorMessage('\'hash\''));
		return;
	}

	let message = await query.getBlockByHash(peer, req.params.channelName, hash, username, orgName);
	res.send(message);
}));
//Query for Channel Information
app.get('/channels/:channelName', awaitHandler(async (req, res) => {
	logger.info('================ GET CHANNEL INFORMATION ======================');
	let peer = req.query.peer;
	logger.info('channelName : ' + req.params.channelName);
	logger.info('peer : ' + peer);
	logger.info('username : ' + username);
	logger.info('userOrg : ' + orgName);

	let message = await query.getChainInfo(peer, req.params.channelName, username, orgName);
	res.send(message);
}));



/************************************************************************************
 * Donor methods
 ************************************************************************************/

// GET Donor
app.get('/donor', awaitHandler(async (req, res) => {
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
app.get('/donor/:donorUserName', awaitHandler(async (req, res) => {
	logger.info('================ GET on Donor by ID');
	logger.info('Donor ID : ' + req.params);
	let args = req.params;
	let fcn = "queryDonor";

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

// POST Donor
app.post('/donor', awaitHandler(async (req, res) => {
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
app.get('/ngo', awaitHandler(async (req, res) => {
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
app.get('/ngo/:ngoRegistrationNumber', awaitHandler(async (req, res) => {
	logger.info('================ GET on NGO by ID');
	logger.info('NGO ID : ' + req.params);
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

// POST NGO
app.post('/ngo', awaitHandler(async (req, res) => {
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
app.get('/donation', awaitHandler(async (req, res) => {
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
app.get('/donation/:donationId', awaitHandler(async (req, res) => {
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

// POST Donation
app.post('/donation', awaitHandler(async (req, res) => {
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
	let fcn = "queryAllSpends";

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

// POST Spend
app.post('/spend', awaitHandler(async (req, res) => {
	logger.info('================ POST on Spend');
	var args = req.body;
	var fcn = "createSpend";

    logger.info('##### POST on Spend - username : ' + username);
	logger.info('##### POST on Spend - userOrg : ' + orgName);
	logger.info('##### POST on Spend - channelName : ' + channelName);
	logger.info('##### POST on Spend - chaincodeName : ' + chaincodeName);
	logger.info('##### POST on Spend - fcn : ' + fcn);
	logger.info('##### POST on Spend - args : ' + JSON.stringify(args));
	logger.info('##### POST on Spend - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

/************************************************************************************
 * SpendAllocation methods
 ************************************************************************************/

// GET the SpendAllocation records for a specific Donation
app.get('/spendallocation', awaitHandler(async (req, res) => {
	logger.info('================ GET on spendAllocation');
	logger.info('Params are: ' + JSON.stringify(req.query));
	if (req.query && req.query.donationId) {
		let args = req.query;
		let fcn = "querySpendAllocationForDonation";
	
		logger.info('##### GET on spendAllocationForDonation - username : ' + username);
		logger.info('##### GET on spendAllocationForDonation - userOrg : ' + orgName);
		logger.info('##### GET on spendAllocationForDonation - channelName : ' + channelName);
		logger.info('##### GET on spendAllocationForDonation - chaincodeName : ' + chaincodeName);
		logger.info('##### GET on spendAllocationForDonation - fcn : ' + fcn);
		logger.info('##### GET on spendAllocationForDonation - args : ' + JSON.stringify(args));
		logger.info('##### GET on spendAllocationForDonation - peers : ' + peers);
	
		let spendAllocationIds = [];
		let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
		logger.info('##### GET on spendAllocationForDonation - queryChaincode : ' + util.inspect(message));
		message.forEach(function(spendAllocation) { 
			logger.info('##### GET on spendAllocationForDonation - spendAllocation is : ' + util.inspect(spendAllocation));
			spendAllocationIds.push(spendAllocation['spendAllocationId']);
		});
		let json = {"spendAllocationIds": spendAllocationIds};
		fcn = "queryHistoryForKey";
		logger.info('##### GET on spendAllocationForDonation - spendAllocationIds : ' + util.inspect(json));
		let history = await query.queryChaincode(peers, channelName, chaincodeName, json, fcn, username, orgName);
		logger.info('##### GET on spendAllocationForDonation - history records for spendAllocationIds : ' + util.inspect(history));
		res.send(message);
	
	}
	else {
		let args = {};
		let fcn = "queryAllSpendAllocations";
	
		logger.info('##### GET on spendAllocation - username : ' + username);
		logger.info('##### GET on spendAllocation - userOrg : ' + orgName);
		logger.info('##### GET on spendAllocation - channelName : ' + channelName);
		logger.info('##### GET on spendAllocation - chaincodeName : ' + chaincodeName);
		logger.info('##### GET on spendAllocation - fcn : ' + fcn);
		logger.info('##### GET on spendAllocation - args : ' + JSON.stringify(args));
		logger.info('##### GET on spendAllocation - peers : ' + peers);
	
		let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
		 res.send(message);
	
	}
}));

/************************************************************************************
 * Error handler
 ************************************************************************************/

app.use(function(error, req, res, next) {
	res.status(500).json({ error: error.toString() });
});


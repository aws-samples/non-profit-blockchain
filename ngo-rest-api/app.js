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
	  default: { appenders: ['out'], level: 'info' },
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
	logger.debug(' ##### New request for URL %s',req.originalUrl);
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
	logger.debug('##### End point : /users - returned from registering the username %s for organization %s',username,orgName);
    logger.debug('##### End point : /users - getRegisteredUser response secret %s',response.secret);
    logger.debug('##### End point : /users - getRegisteredUser response secret %s',response.message);
    if (response && typeof response !== 'string') {
        logger.debug('##### End point : /users - Successfully registered the username %s for organization %s',username,orgName);
		logger.debug('##### End point : /users - getRegisteredUser response %s',response);
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

	logger.debug('channelName : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn : ' + fcn);
	logger.debug('args : ' + args);

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
	logger.debug(args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));
//  Query Get Block by BlockNumber
app.get('/channels/:channelName/blocks/:blockId', awaitHandler(async (req, res) => {
	logger.debug('==================== GET BLOCK BY NUMBER ==================');
	let blockId = req.params.blockId;
	let peer = req.query.peer;
	logger.debug('channelName : ' + req.params.channelName);
	logger.debug('BlockID : ' + blockId);
	logger.debug('Peer : ' + peer);
	if (!blockId) {
		res.json(getErrorMessage('\'blockId\''));
		return;
	}

	let message = await query.getBlockByNumber(peer, req.params.channelName, blockId, username, orgName);
	res.send(message);
}));
// Query Get Transaction by Transaction ID
app.get('/channels/:channelName/transactions/:trxnId', awaitHandler(async (req, res) => {
	logger.debug('================ GET TRANSACTION BY TRANSACTION_ID ======================');
	logger.debug('channelName : ' + req.params.channelName);
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
	logger.debug('================ GET BLOCK BY HASH ======================');
	logger.debug('channelName : ' + req.params.channelName);
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
	logger.debug('================ GET CHANNEL INFORMATION ======================');
	let peer = req.query.peer;
	logger.debug('channelName : ' + req.params.channelName);
	logger.debug('peer : ' + peer);
	logger.debug('username : ' + username);
	logger.debug('userOrg : ' + orgName);

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

    logger.debug('##### GET on Donor - username : ' + username);
	logger.debug('##### GET on Donor - userOrg : ' + orgName);
	logger.debug('##### GET on Donor - channelName : ' + channelName);
	logger.debug('##### GET on Donor - chaincodeName : ' + chaincodeName);
	logger.debug('##### GET on Donor - fcn : ' + fcn);
	logger.debug('##### GET on Donor - args : ' + JSON.stringify(args));
	logger.debug('##### GET on Donor - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific Donor
app.get('/donor/:donorUserName', awaitHandler(async (req, res) => {
	logger.info('================ GET on Donor by ID');
	logger.debug('Donor ID : ' + req.params);
	let args = req.params;
	let fcn = "queryDonor";

    logger.debug('##### GET on Donor - username : ' + username);
	logger.debug('##### GET on Donor - userOrg : ' + orgName);
	logger.debug('##### GET on Donor - channelName : ' + channelName);
	logger.debug('##### GET on Donor - chaincodeName : ' + chaincodeName);
	logger.debug('##### GET on Donor - fcn : ' + fcn);
	logger.debug('##### GET on Donor - args : ' + JSON.stringify(args));
	logger.debug('##### GET on Donor - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// POST Donor
app.post('/donor', awaitHandler(async (req, res) => {
	logger.info('================ POST on Donor');
	var args = req.body;
	var fcn = "createDonor";

    logger.debug('##### POST on Donor - username : ' + username);
	logger.debug('##### POST on Donor - userOrg : ' + orgName);
	logger.debug('##### POST on Donor - channelName : ' + channelName);
	logger.debug('##### POST on Donor - chaincodeName : ' + chaincodeName);
	logger.debug('##### POST on Donor - fcn : ' + fcn);
	logger.debug('##### POST on Donor - args : ' + JSON.stringify(args));
	logger.debug('##### POST on Donor - peers : ' + peers);

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

    logger.debug('##### GET on NGO - username : ' + username);
	logger.debug('##### GET on NGO - userOrg : ' + orgName);
	logger.debug('##### GET on NGO - channelName : ' + channelName);
	logger.debug('##### GET on NGO - chaincodeName : ' + chaincodeName);
	logger.debug('##### GET on NGO - fcn : ' + fcn);
	logger.debug('##### GET on NGO - args : ' + JSON.stringify(args));
	logger.debug('##### GET on NGO - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific NGO
app.get('/ngo/:ngoRegistrationNumber', awaitHandler(async (req, res) => {
	logger.info('================ GET on NGO by ID');
	logger.debug('NGO ID : ' + req.params);
	let args = req.params;
	let fcn = "queryNGO";

    logger.debug('##### GET on NGO - username : ' + username);
	logger.debug('##### GET on NGO - userOrg : ' + orgName);
	logger.debug('##### GET on NGO - channelName : ' + channelName);
	logger.debug('##### GET on NGO - chaincodeName : ' + chaincodeName);
	logger.debug('##### GET on NGO - fcn : ' + fcn);
	logger.debug('##### GET on NGO - args : ' + JSON.stringify(args));
	logger.debug('##### GET on NGO - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// POST NGO
app.post('/ngo', awaitHandler(async (req, res) => {
	logger.info('================ POST on NGO');
	var args = req.body;
	var fcn = "createNGO";

    logger.debug('##### POST on NGO - username : ' + username);
	logger.debug('##### POST on NGO - userOrg : ' + orgName);
	logger.debug('##### POST on NGO - channelName : ' + channelName);
	logger.debug('##### POST on NGO - chaincodeName : ' + chaincodeName);
	logger.debug('##### POST on NGO - fcn : ' + fcn);
	logger.debug('##### POST on NGO - args : ' + JSON.stringify(args));
	logger.debug('##### POST on NGO - peers : ' + peers);

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

    logger.debug('##### GET on Donation - username : ' + username);
	logger.debug('##### GET on Donation - userOrg : ' + orgName);
	logger.debug('##### GET on Donation - channelName : ' + channelName);
	logger.debug('##### GET on Donation - chaincodeName : ' + chaincodeName);
	logger.debug('##### GET on Donation - fcn : ' + fcn);
	logger.debug('##### GET on Donation - args : ' + JSON.stringify(args));
	logger.debug('##### GET on Donation - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific Donation
app.get('/donation/:donationId', awaitHandler(async (req, res) => {
	logger.info('================ GET on Donation by ID');
	logger.debug('Donation ID : ' + req.params);
	let args = req.params;
	let fcn = "queryDonation";

    logger.debug('##### GET on Donation - username : ' + username);
	logger.debug('##### GET on Donation - userOrg : ' + orgName);
	logger.debug('##### GET on Donation - channelName : ' + channelName);
	logger.debug('##### GET on Donation - chaincodeName : ' + chaincodeName);
	logger.debug('##### GET on Donation - fcn : ' + fcn);
	logger.debug('##### GET on Donation - args : ' + JSON.stringify(args));
	logger.debug('##### GET on Donation - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// POST Donation
app.post('/donation', awaitHandler(async (req, res) => {
	logger.info('================ POST on Donation');
	var args = req.body;
	var fcn = "createDonation";

    logger.debug('##### POST on Donation - username : ' + username);
	logger.debug('##### POST on Donation - userOrg : ' + orgName);
	logger.debug('##### POST on Donation - channelName : ' + channelName);
	logger.debug('##### POST on Donation - chaincodeName : ' + chaincodeName);
	logger.debug('##### POST on Donation - fcn : ' + fcn);
	logger.debug('##### POST on Donation - args : ' + JSON.stringify(args));
	logger.debug('##### POST on Donation - peers : ' + peers);

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

    logger.debug('##### GET on Spend - username : ' + username);
	logger.debug('##### GET on Spend - userOrg : ' + orgName);
	logger.debug('##### GET on Spend - channelName : ' + channelName);
	logger.debug('##### GET on Spend - chaincodeName : ' + chaincodeName);
	logger.debug('##### GET on Spend - fcn : ' + fcn);
	logger.debug('##### GET on Spend - args : ' + JSON.stringify(args));
	logger.debug('##### GET on Spend - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// GET a specific Spend
app.get('/spend/:spendId', awaitHandler(async (req, res) => {
	logger.info('================ GET on Spend by ID');
	logger.debug('Spend ID : ' + req.params);
	let args = req.params;
	let fcn = "querySpend";

    logger.debug('##### GET on Spend - username : ' + username);
	logger.debug('##### GET on Spend - userOrg : ' + orgName);
	logger.debug('##### GET on Spend - channelName : ' + channelName);
	logger.debug('##### GET on Spend - chaincodeName : ' + chaincodeName);
	logger.debug('##### GET on Spend - fcn : ' + fcn);
	logger.debug('##### GET on Spend - args : ' + JSON.stringify(args));
	logger.debug('##### GET on Spend - peers : ' + peers);

    let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
 	res.send(message);
}));

// POST Spend
app.post('/spend', awaitHandler(async (req, res) => {
	logger.info('================ POST on Spend');
	var args = req.body;
	var fcn = "createSpend";

    logger.debug('##### POST on Spend - username : ' + username);
	logger.debug('##### POST on Spend - userOrg : ' + orgName);
	logger.debug('##### POST on Spend - channelName : ' + channelName);
	logger.debug('##### POST on Spend - chaincodeName : ' + chaincodeName);
	logger.debug('##### POST on Spend - fcn : ' + fcn);
	logger.debug('##### POST on Spend - args : ' + JSON.stringify(args));
	logger.debug('##### POST on Spend - peers : ' + peers);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
	res.send(message);
}));

/************************************************************************************
 * SpendAllocation methods
 ************************************************************************************/

// GET the SpendAllocation records for a specific Donation
app.get('/spendallocation', awaitHandler(async (req, res) => {
	logger.info('================ GET on spendAllocation');
	logger.info('Req is: ' + util.inspect(req));
	logger.info('Params are: ' + JSON.stringify(req.query));
	if (req.query && req.query.donationId) {
		let args = req.query;
		let fcn = "querySpendAllocationForDonation";
	
		logger.debug('##### GET on spendAllocationForDonation - username : ' + username);
		logger.debug('##### GET on spendAllocationForDonation - userOrg : ' + orgName);
		logger.debug('##### GET on spendAllocationForDonation - channelName : ' + channelName);
		logger.debug('##### GET on spendAllocationForDonation - chaincodeName : ' + chaincodeName);
		logger.debug('##### GET on spendAllocationForDonation - fcn : ' + fcn);
		logger.debug('##### GET on spendAllocationForDonation - args : ' + JSON.stringify(args));
		logger.debug('##### GET on spendAllocationForDonation - peers : ' + peers);
	
		let spendAllocationIds = [];
		let message = await query.queryChaincode(peers, channelName, chaincodeName, args, fcn, username, orgName);
		logger.debug('##### GET on spendAllocationForDonation - queryChaincode : ' + JSON.stringify(message));
		message.forEach(function(spendAllocation) { 
			logger.debug('##### GET on spendAllocationForDonation - spendAllocation is : ' + JSON.stringify(spendAllocation));
			spendAllocationIds.push(spendAllocation['spendAllocationId']);
		});
		let json = {"spendAllocationIds": spendAllocationIds};
		fcn = "queryHistoryForKey";
		logger.debug('##### GET on spendAllocationForDonation - spendAllocationIds : ' + JSON.stringify(json));
		let history = await query.queryChaincode(peers, channelName, chaincodeName, json, fcn, username, orgName);
		 res.send(message);
	
	}
	else {
		let args = {};
		let fcn = "queryAllSpendAllocations";
	
		logger.debug('##### GET on spendAllocation - username : ' + username);
		logger.debug('##### GET on spendAllocation - userOrg : ' + orgName);
		logger.debug('##### GET on spendAllocation - channelName : ' + channelName);
		logger.debug('##### GET on spendAllocation - chaincodeName : ' + chaincodeName);
		logger.debug('##### GET on spendAllocation - fcn : ' + fcn);
		logger.debug('##### GET on spendAllocation - args : ' + JSON.stringify(args));
		logger.debug('##### GET on spendAllocation - peers : ' + peers);
	
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


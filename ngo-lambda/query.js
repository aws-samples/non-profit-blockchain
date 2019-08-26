'use strict';

const config = require("./config");
const setupCrypto = require("./setupCrypto");
const setupChannel = require("./setupChannel");
const logger = require("./logging").getLogger("query");

async function query(request) {
    let { fabric_client } = await setupCrypto();  
    const username = config.fabricUsername;  

    // first check to see if the user is already enrolled
    let user = await fabric_client.getUserContext(username, true);
    if (!user || !user.isEnrolled()) {
        throw new Error('Failed to get ' + username + '.... run enrollUsers.js');
	}

    // send the query proposal to the peer
    let channel = setupChannel(fabric_client);
	return channel.queryByChaincode(request)
    .then((query_responses) => {
        logger.info("Query has completed, checking results");
        // query_responses could have more than one  results if there multiple peers were used as targets
        if (query_responses && query_responses.length == 1) {
            if (query_responses[0] instanceof Error) {
                logger.error("error from query = ", query_responses[0]);
            } else {
                logger.info("query responses is " + query_responses);
                logger.info("Response is ", query_responses[0].toString());
                return query_responses[0].toString();
            }
        } else {
            logger.info("No payloads were returned from query");
        }
    }).catch((err) => {
	    logger.error('Failed to query successfully :: ' + err);
    });
}

module.exports = query;
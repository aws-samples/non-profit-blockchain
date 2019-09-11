'use strict';

const setupCrypto = require("./setupCrypto");
const setupChannel = require("./setupChannel");
const logger = require("./logging").getLogger("query");

async function query(request) {
    logger.info("=== Query Function Start ===");
    let { fabric_client } = await setupCrypto();  

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
        logger.info("=== Query Function End ===");
    }).catch((err) => {
	    logger.error('Failed to query successfully :: ' + err);
    });
}

module.exports = query;
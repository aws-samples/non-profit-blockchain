const fs = require("fs");
const path = require("path");
const config = require("./config");

function setupChannel(client) {
    let channel = client.getChannel(config.channelName, false);
    if (channel == null) {
        channel = client.newChannel(config.channelName);
    }

    let peer = channel.getPeers()[0];
    const pemfile = fs.readFileSync(path.resolve(__dirname, "./certs/managedblockchain-tls-chain.pem"), "utf8");

    if (!peer) {
        peer = client.newPeer(config.peerEndpoint, {pem:pemfile});
        channel.addPeer(peer);
    }

	const order = fabric_client.newOrderer(config.ordererEndpoint, {pem:pemfile})
	channel.addOrderer(order);
	return channel;
}

module.exports = setupChannel;
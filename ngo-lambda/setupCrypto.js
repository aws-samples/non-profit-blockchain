const path = require('path');
const Fabric_Client = require('fabric-client');
const config = require("./config");

async function setupCrypto() {    
    
    const store_path = path.join(config.cryptoFolder);
	fabric_client = Fabric_Client.loadFromConfig(path.join(__dirname, "./ngo-connection-profile.yaml"));
	fabric_client.loadFromConfig(path.join(__dirname, "./client-org1.yaml"));
	return Fabric_Client.newDefaultKeyValueStore({ path: store_path})
	.then(async (state_store) => {
			fabric_client.setStateStore(state_store);
			const crypto_suite = Fabric_Client.newCryptoSuite();
			const crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
			crypto_suite.setCryptoKeyStore(crypto_store);
			fabric_client.setCryptoSuite(crypto_suite);

			return { fabric_client };
	});
}

module.exports = setupCrypto;
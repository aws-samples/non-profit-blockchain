const path = require('path');
const Fabric_Client = require('fabric-client');
const config = require("./config");

function getPrivateKeyPEM(username) {
	const certsPath = config.cryptoFolder + "/" + username + "/keystore/";
	const files = fs.readdirSync(certsPath);
	return fs.readFileSync(path.join(certsPath, files[0]));
}

function getCertPEM(username) {
	return fs.readFileSync(config.cryptoFolder + username + "/signcerts/cert.pem").toString();
}

async function setupCrypto() {    
    
	let fabric_client = Fabric_Client.loadFromConfig(path.join(__dirname, "./ngo-connection-profile.yaml"));
	fabric_client.loadFromConfig(path.join(__dirname, "./client-org1.yaml"));

	const username = config.fabricUsername;
	const store_path = path.join(config.cryptoFolder);

	const crypto_suite = Fabric_Client.newCryptoSuite();
	const crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);

	const fabricUser = await fabric_client.createUser({username, mspid: config.MSP_ID, cryptoContent: {privateKeyPEM: getPrivateKeyPEM(username), signedCertPEM: getCertPEM(username)}, skipPersistence: true});
	fabric_client.setUserContext(fabricUser, true);

	return { fabric_client };
}

module.exports = setupCrypto;
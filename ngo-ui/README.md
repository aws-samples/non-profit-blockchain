# NGO Chaincode

The instructions in this README will help you to install the NGO User Interface application,
and connect it to the REST API you created in Part 3.

The UI is a Node.js / AngularJS application and will run on your Cloud9 instance.

All steps are carried out on the Cloud9 instance you created in Part 1.

## Pre-requisites

You will need to set the context before carrying out any Fabric CLI commands. We do this 
using the export files that were generated for us in Part 1.

You should have already cloned the repo below. You would have done this when setting up the
Fabric network in [Part 1:](ngo-fabric/README.md).

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

Source the file, so the exports are applied to your current session. If you exit the SSH 
session and re-connect, you'll need to source the file again.

```
cd ~/non-profit-blockchain/ngo-fabric
source fabric-exports.sh
```

Check the peer export file exists and that it contains a number of export keys with values:

```
cat ~/peer-exports.sh 
```
If the file has values for all keys, source it:

```
source ~/peer-exports.sh 
```

## Step 1 - clone the repo containing the chaincode


### Install Node
On Cloud9.

Install Node.js. We will use v8.x.

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
```

```
. ~/.nvm/nvm.sh
nvm install lts/carbon
nvm use lts/carbon
```

### Npm dependency install

```
cd ~/non-profit-blockchain/ngo-ui
npm i
```

## Start the application

```
cd ~/non-profit-blockchain/ngo-ui
nvm use lts/carbon
npm start &
```

You should see this:

```
** Angular Live Development Server is listening on 0.0.0.0:8080, open your browser on http://localhost:8080/ **
```






**Warning**

To change the location of the REST API that the UI depends on, change the values in these files:

```
vi src/environments/environment.ts 
vi src/environments/environment.prod.ts
```

The values to be changed are as follows. The trailing backslash is important.

```
  api_url: 'http://ngo10-elb-2090058053.us-east-1.elb.amazonaws.com/',
  socket_url: 'ws://ngo10-elb-2090058053.us-east-1.elb.amazonaws.com'
```

> Verify that you are running at least node 8.9.x, Angular7.x, Angular cli and npm 5.x.x by running node -v and npm -v in a terminal/console window. Older versions produce errors, but newer versions are fine.

1. Go to project folder and install dependencies.
     ```bash
     npm i
     ```

2. Launch development server:
     ```bash
     npm start
     ```

 3. Create production build:
Change production server url: src/environments/environment.prod.ts
     ```bash
     vi src/environments/environment.prod.ts
     ```
      api_url: 'Your prod server api URL',
      socket_url: 'Your prod server socket URL'
     ```
     npm run build  
     ```

**Note**

> You don't need to build the Demo app library because it's published in npm and added as dependency of the project.


Tasks                    | Description
-------------------------|---------------------------------------------------------------------------------------
npm i                    | Install dependencies
npm start                | Start the app in development mode
npm run build            | Build the app for production

## Pat yourself on the back, you've completed the workshop
The workshop instructions can be found in the README files in parts 1-4:

* [Part 1:](ngo-fabric/README.md) Start the workshop by building the AWS Managed Blockchain Hyperledger Fabric network.
* [Part 2:](ngo-chaincode/README.md) Deploy the NGO chaincode. Instructions can be found in the README under ngo-chaincode.
* [Part 3:](ngo-rest-api/README.md) Run the REST API. Instructions can be found in the README under ngo-rest-api.
* [Part 4:](ngo-ui/README.md) Run the Application. Instructions can be found in the README under ngo-ui.

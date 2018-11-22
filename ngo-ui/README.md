# Part 4: The User Interface

The UI is a Node.js / AngularJS application and will run on your Cloud9 instance.
The instructions in this README will help you to install the NGO User Interface application,
and connect it to the REST API you created in [Part 3:](../ngo-rest-api/README.md).

All steps are carried out on the Cloud9 instance you created in [Part 1.](../ngo-fabric/README.md).

## Which browser?

The UI has been tested with recent version of Firefox and Chrome. 

The Node.js serving the application will run on your Cloud9 instance. One interesting 'feature'
of Cloud9 is that you can preview the running application in your Cloud9 IDE, and also 
pop this out into a browser window. HOWEVER, you cannot copy the URL into another browser
and expect it to work. Cloud9 will only show the application in the same browser as the
Cloud9 IDE is running. If you are running Cloud9 in Firefox, you can preview the application
in Firefox, but you cannot copy the URL and view the application in Chrome. If you wanted to
do this, you would need to login to the same AWS account in Chrome, open up the same Cloud9 IDE, 
and preview the same application. You could then see the application running in both Firefox
and Chrome. Incidentally, you'd also be using the collaboration features of Cloud9 if you did this,
simulating two users sharing the same IDE session.

## Pre-requisites
On Cloud9.

Your REST API should be exposed via an AWS Elastic Load Balancer (ELB). The ELB was created for you
by CloudFormation in [Part 1.](../ngo-fabric/README.md). You can find the DNS endpoint for the ELB in
the Outputs of your CloudFormation stack in the CloudFormation console.

You should have already cloned this repo in [Part 1.](../ngo-fabric/README.md)

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

## Step 1 - install Node
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

## Step 2 - install dependencies

```
cd ~/non-profit-blockchain/ngo-ui
npm i
```

## Step 3 - point the Node.js application to your REST API

Your REST API is exposed via an AWS Elastic Load Balancer (ELB). The ELB was created for you
by CloudFormation in [Part 1.](../ngo-fabric/README.md). You can find the DNS endpoint for the ELB in
the Outputs of your CloudFormation stack in the CloudFormation console.

Edit the file below and change the location of the REST API that the UI depends on:

```
vi src/environments/environment.ts 
```

The values to be changed are as follows. The trailing backslash is important for the api_url.

```
  api_url: 'http://ngo10-elb-2090058053.us-east-1.elb.amazonaws.com/',
  socket_url: 'ws://ngo10-elb-2090058053.us-east-1.elb.amazonaws.com'
```

## Step 4 - start the application

```
cd ~/non-profit-blockchain/ngo-ui
nvm use lts/carbon
npm start &
```

You should see this:

```
** Angular Live Development Server is listening on 0.0.0.0:8080, open your browser on http://localhost:8080/ **
```

In Cloud9, navigate to the Cloud9 menu and click Preview->Preview Running Application. This will show
the UI login page in a pane in the Cloud9 IDE. You can expand this out to your browser by clicking the 
icon next to the URL in the preview pane.

## Step 5 - register a user in the application
Registering a user is necessary before you carry out any tasks in the UI application. User registration
will call the Fabric CA and enroll a new user. This user will then be used to invoke transactions and
execute queries against the Fabric network. You can register a new user in the UI application. The link
is on the login page. You can then login as that user and explore the application.

All of the information you see in the application is stored in the AWS Managed Blockchain Fabric network. 
You can check this by querying the REST API directly. You can cURL the REST API from the Fabric client 
node. Examples of the cURL commands used with the REST API can be found in the files that load test data 
into the network, such as [this one](../ngo-rest-api/ngo-load-workshop.sh)

You could also query the chaincode directly and see the same information. You query the chaincode from 
the Fabric client node. An example of how to query the chaincode can be found in [this script](../ngo-chaincode/test-chaincode-aws.sh)

## Step 6 - pat yourself on the back, you've completed the workshop
The workshop instructions can be found in the README files in parts 1-4:

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the AWS Managed Blockchain Hyperledger Fabric network.
* [Part 2:](../ngo-chaincode/README.md) Deploy the NGO chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the REST API. 
* [Part 4:](../ngo-ui/README.md) Run the Application. 

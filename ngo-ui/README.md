# Part 4: The User Interface

The UI is a Node.js / AngularJS application and will run on your AWS Cloud9 instance.
The instructions in this README will help you to install the NGO User Interface application,
and connect it to the REST API you created in [Part 3:](../ngo-rest-api/README.md).

All steps are carried out on the Cloud9 instance you created in [Part 1](../ngo-fabric/README.md).

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

Open a new terminal pane.  Click on Window -> New Terminal.  **You should not be SSH'ed into the Fabric client node for this.**

Your REST API should be exposed via an AWS Elastic Load Balancer (ELB). The ELB was created for you
by AWS CloudFormation in [Part 1](../ngo-fabric/README.md). You can find the DNS endpoint for the ELB in
the Outputs of your CloudFormation stack in the AWS CloudFormation console.

You should have already cloned this repo in [Part 1](../ngo-fabric/README.md)

```
cd ~
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

## Step 1 - Install Node
On Cloud9.

Install Node.js. We will use v14.x.

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.3/install.sh | bash
```

```
. ~/.nvm/nvm.sh
nvm install 14
nvm use 14
```

## Step 2 - Install dependencies

```
cd ~/non-profit-blockchain/ngo-ui
npm i
```

## Step 3 - Point the Node.js application to your REST API

Your REST API is exposed via an AWS Elastic Load Balancer (ELB). The ELB was created for you
by CloudFormation in [Part 1](../ngo-fabric/README.md). You can find the DNS endpoint for the ELB in
the Outputs of your CloudFormation stack in the CloudFormation console. In the statements below we 
will query the CloudFormation stack to obtain the DNS endpoint, then replace this in the Node.js environment config file:

```
export REGION=us-east-1
export FABRICSTACK=ngo-fabric-client-node
export ELBURL=$(aws cloudformation --region $REGION describe-stacks --stack-name $FABRICSTACK --query "Stacks[0].Outputs[?OutputKey=='ELBDNS'].OutputValue" --output text)
sed -i "s|__ELBURL__|$ELBURL|g" src/environments/environment.ts 
```

## Step 4 - Start the application

```
cd ~/non-profit-blockchain/ngo-ui
nvm use 14
npm start &
```

You should see this:

```
** Angular Live Development Server is listening on 0.0.0.0:8080, open your browser on http://localhost:8080/ **
```

In Cloud9, navigate to the Cloud9 menu and click Preview->Preview Running Application. This will show
the UI login page in a pane in the Cloud9 IDE. You can expand this out to your browser by clicking the 
icon next to the URL in the preview pane.

NOTE: You must remove the `https://` protocol from the Cloud9 URL. The application does not use TLS/SSL,
and most modern browsers will not allow you to call an HTTPS endpoint when the underlying application
makes HTTP calls.

**If the application is not loading, check that you started the Angular app in a Cloud 9 terminal, and not on the Fabric Client Node.**

## Step 5 - Register a user in the application
Registering a user is necessary before you carry out any tasks in the UI application. User registration
will call the Fabric CA and enroll a new user. This user will then be used to invoke transactions and
execute queries against the Fabric network. You can register a new user in the UI application, using the 
'Sign up' link on the login page. You can then login as that user and explore the application. Note that
user names should be 4 characters or more.

If you see an error during registration stating that HTTPS and not HTTP should be used, try the following. The console (F12) may show a CORS issue. Both of these errors are misleading. The issue is usually caused by:
* the URL of the ELB not being updated in src/environments/environment.ts. See step 3 above
* the REST API server is not running, or not accessible

## Step 6 - Exploring the application

The application allows you to view non-profit organisations and see their details, the causes they support,
the total donations they have received and how much of those donations they have spent. You can also view
a gallery of images which elaborate on the projects the non-profit is involved in.

You can donate funds to any non-profit and see all of your donations by clicking the 'My Donations' link
in the main menu, near your user name. When viewing a non-profit you can select 'Utilized fund' to check
how they are spending the funds.

Behind the scenes is a function that automatically and randomly spends the donations. As donations are spent,
new 'spend' transactions are created in Fabric, which result in new blocks added to the Fabric network. You
will see the blocks appearing in the 'Blockchain Events' on the main NGO list. Hovering your mouse over the
block will show you the transaction ID's of all transactions appearing in that block. Blocks will also be created
as you donate funds to a non-profit.

See the function `dummySpend()` in `ngo-rest-api/app.js` for details on how spend records are randomly created.

All of the information you see in the application is stored in the Fabric network Amazon Managed Blockchain . 
You can check this by querying the REST API directly. You can cURL the REST API from the Fabric client 
node. Examples of the cURL commands used with the REST API can be found in the files that load test data 
into the network, such as [this one](../ngo-rest-api/ngo-load-workshop.sh)

You could also query the chaincode directly and see the same information. You query the chaincode from 
the Fabric client node. An example of how to query the chaincode can be found in [this script](../ngo-chaincode/test-chaincode-aws.sh)

## Long lived RESTful API server and User Interface application using PM2
If you want to run the RESTful API server and the user interface application in such a way that they continue
to run after you close your SSH or Cloud9 session, you can use PM2, as follows:

Install pm2 on both Cloud9 and the Fabric client node:

```
npm install pm2 -g
```

For Cloud9:

```
cd ~/non-profit-blockchain/ngo-ui
pm2 start npm -- start
```

For the Fabric client node:

```
cd ~/non-profit-blockchain/ngo-rest-api
pm2 start app.js
```

You can tail the logs:

```
tail -f ~/.pm2/logs/app-out.log     
```

## Step 6 - Pat yourself on the back, you've completed the workshop
You have successfully built a Hyperledger Fabric network using Amazon Managed Blockchain, deployed
chaincode, connected a RESTful API to the Fabric network and deployed an Angular application that
communicates with the RESTful API.

The workshop instructions can be found in the README files in parts 1-4:

* [Part 1:](../ngo-fabric/README.md) Start the workshop by building the Hyperledger Fabric blockchain network using Amazon Managed Blockchain.
* [Part 2:](../ngo-chaincode/README.md) Deploy the non-profit chaincode. 
* [Part 3:](../ngo-rest-api/README.md) Run the RESTful API server. 
* [Part 4:](../ngo-ui/README.md) Run the application. 
* [Part 5:](../new-member/README.md) Add a new member to the network. 
* [Part 6:](../ngo-lambda/README.md) Read and write to the blockchain with Amazon API Gateway and AWS Lambda.
* [Part 7:](../ngo-events/README.md) Use blockchain events to notify users of NGO donations.
* [Part 8:](../blockchain-explorer/README.md) Deploy Hyperledger Explorer. 

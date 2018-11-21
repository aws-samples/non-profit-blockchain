## Block Chain Demo App

## Demo app with Angular 7 + Angular CLI

### Table of contents

- [Quick start](#quick-start)
- [Thanks](#thanks)
- [Copyright and license](#copyright-and-license)

## Quick start

You should have already cloned the repo below. You would have done this when setting up the
Fabric network.

```
cd
git clone https://github.com/aws-samples/non-profit-blockchain.git
```

### Install Node
On Cloud9

```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
```

```
. ~/.nvm/nvm.sh
nvm install lts/carbon
nvm use lts/carbon
```

Amazon Linux seems to be missing g++, so:

```
sudo yum install gcc-c++
```

### Npm dependency install

```
cd ~/non-profit-blockchain/ngo-ui
npm i
```

### Npm start

```
cd ~/non-profit-blockchain/ngo-ui
npm start
```

**Warning**

To change the location of the REST API that the UI depends on, change the values in these files:

```
vi src/environments/environment.ts 
vi src/environments/environment.prod.ts
```

The values to be changed are as follows. The trailing backslash is important.

```
  api_url: 'http://ngo4-687718776.us-east-1.elb.amazonaws.com/',
  socket_url: 'ws://ngo4-687718776.us-east-1.elb.amazonaws.com/'
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



## Thanks

Thanks to all contributors and their support:

## Copyright and license
Enjoy :metal:

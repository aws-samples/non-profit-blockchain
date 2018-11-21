## Block Chain Demo App

## Demo app with Angular 7 + Angular CLI

### Table of contents

- [Quick start](#quick-start)
- [Thanks](#thanks)
- [Copyright and license](#copyright-and-license)

## Quick start

**Warning**

> Verify that you are running at least node 8.9.x, Angular7.x, Angualar cli and npm 5.x.x by running node -v and npm -v in a terminal/console window. Older versions produce errors, but newer versions are fine.

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

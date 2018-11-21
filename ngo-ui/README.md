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


Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License").
You may not use this file except in compliance with the License.
A copy of the License is located at

     http://www.apache.org/licenses/LICENSE-2.0

or in the "license" file accompanying this file. This file is distributed
on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
express or implied. See the License for the specific language governing
permissions and limitations under the License.

FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY certs/ certs/
COPY . .

EXPOSE 5000

CMD [ "npm", "start" ]

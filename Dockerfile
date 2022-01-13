FROM node:12

WORKDIR /user/src/app

COPY package*.json ./

RUN npm install

COPY ./public .

EXPOSE 3000
CMD ["node", "index.js"]
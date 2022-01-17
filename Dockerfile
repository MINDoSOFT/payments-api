FROM node:12

WORKDIR /user/src/app

COPY package*.json ./

RUN npm install

COPY ./public .

EXPOSE 3000

ENV VAULT_HOST=vault
ENV MONGO_DB_HOST=mongodb_container

CMD ["node", "index.js"]
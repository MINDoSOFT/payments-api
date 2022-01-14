# Introduction

This project uses a Node container which runs an express api that handles payment operations (list, create, get, approve, cancel).
The Node container connects to the MongoDB by retrieving a dynamic username and password from Vault.
MongoDB and Vault run on their own separate containers.

## To add the user please run:
```bash
npm run seed
```

## To create a new vault roleId and SecretId please run the following commands:
```bash
docker-compose up
./vault-scripts/00-mongodb-secrets.sh
./vault-scripts/01-paymentsapi-app-role.sh
docker-compose up --build payments-api
```

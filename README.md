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

# Future work:

After adding the IPaymentRepo, and the controller knew only the PaymentObject (POCO), from the MongoPaymentRepo in the update method, I needed to fetch the entity from the database, even though I already had it. The reason was that, when doing new on an entity class Mikro-ORM creates a new document in MongoDB. Is there a way to avoid the extra database call ?

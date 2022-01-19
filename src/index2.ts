// dotenv should be the first function in order to properly get the orm options
import dotenv from 'dotenv';

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
    throw dotenvResult.error;
}

import { MockVaultService, VaultService } from './services/vault-service';
import { readFileSync } from 'fs';

import { MongoService, MongoServiceType } from './services/mongo-service';
import { VaultServiceInterface } from './interfaces/services/vault-service-interface';

let vaultService : VaultServiceInterface;

if (process.env.VAULT_TYPE && process.env.VAULT_TYPE == 'MOCK') {
    vaultService = new MockVaultService('just a test username', 'just a test password');
} else {
    const vaultHost = process.env.VAULT_HOST;

    const vaultOptions = {
    apiVersion: 'v1', // default
    endpoint: `http://${vaultHost}:8200` // default
    };

    const roleId = readFileSync('./vault-data/payments-api-role_id', 'utf8');
    const secretId = readFileSync('./vault-data/payments-api-secret_id', 'utf8');

    vaultService = new VaultService(vaultOptions, roleId, secretId);
}

let mongoType : MongoServiceType = MongoServiceType.REAL;

if (process.env.MONGO_DB_TYPE && process.env.MONGO_DB_TYPE == 'INMEMORY') {
    mongoType = MongoServiceType.INMEMORY;
}

const mongoService = MongoService.getInstance();

let initInput : initMongoInput;

import { initMongoInput } from './interfaces/services/mongo-service-interface';

Promise.resolve(vaultService.init()).
then(() => 
    Promise.resolve(vaultService.getCredentials({path : 'mongodb/creds/payments-api-client'})).
    then((mongoDbCreds) => {
        initInput = {mongoType, username: mongoDbCreds.username, password: mongoDbCreds.password};
    }).
        then(() => 
        Promise.resolve(mongoService.init(initInput)).
            then(() => {
                import("./app").then(({ start }) => {
                    // The dynamic import here is required to give a chance for MongoDB to init!
                    start();
                });
            })
        )
);
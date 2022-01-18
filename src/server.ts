// dotenv should be the first function in order to properly get the orm options
import dotenv from 'dotenv';

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
    throw dotenvResult.error;
}

import {app, setupRoutes} from './index'
export {app} from './index'
import * as http from 'http';
import { MockVaultService, VaultService } from './services/vault-service';
import { readFileSync } from 'fs';

import { MongoService, MongoServiceType } from './services/mongo-service';
import { VaultServiceInterface } from './interfaces/services/vault-service-interface';

const vaultHost = process.env.VAULT_HOST;

const vaultOptions = {
  apiVersion: 'v1', // default
  endpoint: `http://${vaultHost}:8200` // default
};

const roleId = readFileSync('./vault-data/payments-api-role_id', 'utf8');
const secretId = readFileSync('./vault-data/payments-api-secret_id', 'utf8');

let vaultService : VaultServiceInterface;

if (process.env.VAULT_TYPE && process.env.VAULT_TYPE == 'MOCK') {
    vaultService = new MockVaultService('just a test username', 'just a test password');
} else {
    vaultService = new VaultService(vaultOptions, roleId, secretId);
}

let mongoType : MongoServiceType = MongoServiceType.REAL;

if (process.env.MONGO_DB_TYPE && process.env.MONGO_DB_TYPE == 'INMEMORY') {
    mongoType = MongoServiceType.INMEMORY;
}

let mongoService : MongoService;

Promise.resolve(vaultService.init()).
then(() => 
    Promise.resolve(vaultService.getCredentials({path : 'mongodb/creds/payments-api-client'})).
    then((mongoDbCreds) => {
        mongoService = new MongoService(mongoType, mongoDbCreds.username, mongoDbCreds.password);
    }).
    then(() => Promise.resolve(mongoService.init().
        then(() => {
            setupRoutes(mongoService);
        })).
        then(() => {
            runServer();
        })));

export let server: http.Server = http.createServer();

async function runServer() {
    const port = 3000;
    const runningMessage = `Payments-api running at http://localhost:${port}`;
    server = http.createServer(app);
    server.listen(port, () => {
        console.log(runningMessage);
        app.emit("paymentsAPIStarted");
    });
}

export function closeServer() {
    if (mongoService) mongoService.closeOrm();
    if (server) server.close();
}
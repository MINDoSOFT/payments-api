// dotenv should be the first function in order to properly get the orm options
import dotenv from 'dotenv';

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
    throw dotenvResult.error;
}

import * as http from 'http';
import { MockVaultService, VaultService } from './services/vault-service';
import { readFileSync } from 'fs';

import { MongoService, MongoServiceType } from './services/mongo-service';
import { VaultServiceInterface } from './interfaces/services/vault-service-interface';
import { Index } from '.';

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

let mongoService : MongoService;

let index = Index.getInstance();

Promise.resolve(vaultService.init()).
then(() => 
    Promise.resolve(vaultService.getCredentials({path : 'mongodb/creds/payments-api-client'})).
    then((mongoDbCreds) => {
        mongoService = new MongoService(mongoType, mongoDbCreds.username, mongoDbCreds.password);
    }).
    then(() => Promise.resolve(mongoService.init().
        then(() => {
            index.init(mongoService);
            index.setupRoutes();
        })).
        then(() => {
            runServer();
        })));

export let server: http.Server = http.createServer();

async function runServer() {
    const port = 3000;
    const runningMessage = `Payments-api running at http://localhost:${port}`;
    server = http.createServer(index.getApp());
    server.listen(port, () => {
        console.log(runningMessage);
        index.getApp().emit("paymentsAPIStarted");
    });
}

export function getApp() {
    return index.getApp();
}

export function getUserService() {
    return index.getUserService();
}

export function closeServer() {
    console.log('Closing server...');
    if (mongoService) mongoService.closeOrm();
    if (server) server.close();
    console.log('Server closed.');
}
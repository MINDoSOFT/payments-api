// dotenv should be the first function in order to properly get the orm options
import dotenv from 'dotenv';

const dotenvResult = dotenv.config();
if (dotenvResult.error) {
    throw dotenvResult.error;
}

import {app, setupRoutes} from './index'
export {app} from './index'
import * as http from 'http';
import { VaultService } from './services/vault-service';
import { readFileSync } from 'fs';
import ormOptions from './mikro-orm.config';
import { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/core';
import { User } from './entities/User';
import { Payment } from './entities/Payment';

const DI = {} as {
  orm: MikroORM;
  em: EntityManager;
  userRepository: EntityRepository<User>;
  paymentRepository: EntityRepository<Payment>;
};

const vaultHost = process.env.VAULT_HOST;

const vaultOptions = {
  apiVersion: 'v1', // default
  endpoint: `http://${vaultHost}:8200` // default
};

const roleId = readFileSync('./vault-data/payments-api-role_id', 'utf8');
const secretId = readFileSync('./vault-data/payments-api-secret_id', 'utf8');

const vaultService = new VaultService(vaultOptions, roleId, secretId);

Promise.resolve(vaultService.init()).
then(() => 
    Promise.resolve(vaultService.getCredentials({path : 'mongodb/creds/payments-api-client'})).
    then((mongoDbCreds) => {
            ormOptions.user = mongoDbCreds.username;
            ormOptions.password = mongoDbCreds.password;
    }).
    then(() => Promise.resolve(MikroORM.init(ormOptions).
        then((orm) => {
            DI.orm = orm;
            DI.em = DI.orm.em;
            DI.userRepository = DI.orm.em.getRepository(User);
            DI.paymentRepository = DI.orm.em.getRepository(Payment);

            setupRoutes(DI.em, DI.userRepository, DI.paymentRepository);
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
    if (server) server.close();
    if (DI.orm) DI.orm.close();
}
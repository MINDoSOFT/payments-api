
import bodyParser from 'body-parser';
import express from 'express';
import 'reflect-metadata';
import { EntityManager, EntityRepository, MikroORM, RequestContext } from '@mikro-orm/core';
import { User } from './entities/User.js';
import ormOptions from './mikro-orm.config.js';

import NodeVault = require ('node-vault');
import { VaultCredsResponse } from './interfaces/VaultCredsResponse';

import expressjwt = require('express-jwt');
import { Payment } from './entities/Payment';

import {
	StatusCodes
} from 'http-status-codes';

import { readFileSync } from 'fs';
import { AuthenticateController } from './controllers/authenticate-controller';
import { JWT_SINGING_KEY } from './constants.js';
import { PaymentsController } from './controllers/payments-controller.js';

const roleId = readFileSync('./vault-data/payments-api-role_id', 'utf8')
const secretId = readFileSync('./vault-data/payments-api-secret_id', 'utf8')

export const DI = {} as {
  orm: MikroORM,
  em: EntityManager,
  userRepository: EntityRepository<User>,
  paymentRepository: EntityRepository<Payment>,
};

const app = express();
const port = 3000;

const vaultOptions = {
  apiVersion: 'v1', // default
  endpoint: 'http://vault:8200', // default
};

const expressJwtHandler = expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] });

(async () => {

  const vault = NodeVault(vaultOptions)

  await vault.approleLogin({ role_id: roleId, secret_id: secretId })  

  const mongodbCreds : VaultCredsResponse = await vault.read('mongodb/creds/payments-api-client');
  
  ormOptions.user = mongodbCreds.data.username;
  ormOptions.password = mongodbCreds.data.password;

  DI.orm = await MikroORM.init(ormOptions);
  DI.em = DI.orm.em;
  DI.userRepository = DI.orm.em.getRepository(User);
  DI.paymentRepository = DI.orm.em.getRepository(Payment);
  
  app.use(bodyParser.json());
  app.use((_req, _res, next) => RequestContext.create(DI.orm.em, next));

  app.get('/', (_req: express.Request, res: express.Response) => {
    return res.status(StatusCodes.OK).send('Hello World!')
  });
  
  const authenticateController = new AuthenticateController(DI.userRepository);

  app.post('/v1/authenticate/', authenticateController.authenticateUser);

  app.get('/protected', 
    expressJwtHandler,
    authenticateController.helloProtectedWorld
  );

  const paymentsController = new PaymentsController(DI.paymentRepository);

  app.get('/v1/payments', 
    expressJwtHandler,
    paymentsController.getPayments
  );

  app.post('/v1/payments', 
    expressJwtHandler,
    paymentsController.createPayment
  );

  app.get('/v1/payment/:id', 
    expressJwtHandler,
    paymentsController.getPayment
  );

  app.put('/v1/payment/:id/approve', 
    expressJwtHandler,
    paymentsController.approvePayment
  );

  app.put('/v1/payment/:id/cancel', 
    expressJwtHandler,
    paymentsController.cancelPayment
  );
  
  app.use(authenticateController.handleAuthenticationError)

  app.listen(port, () => {
    console.log(`Payments-api listening on port ${port}!`)
  });

})();
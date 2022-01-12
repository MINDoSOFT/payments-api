
import bodyParser from 'body-parser';
import express from 'express';
import 'reflect-metadata';
import { EntityManager, EntityRepository, MikroORM, RequestContext } from '@mikro-orm/core';
import { AuthenticateRequest, AuthenticateResponse } from './interfaces/routes/authenticate';
import { ErrorDetail, ErrorResponse } from './interfaces/routes/error.js';
import { User } from './entities/User.js';
import ormOptions from './mikro-orm.config.js';

import NodeVault = require ('node-vault');
import { VaultCredsResponse } from './interfaces/VaultCredsResponse';

import expressjwt = require('express-jwt');
import jsonwebtoken = require('jsonwebtoken');
import { isUserJWT, UserJWT } from './interfaces/UserJWT';
import { CreatePaymentRequest, CreatePaymentResponse, GetPaymentRequest, GetPaymentResponse, MapPaymentEntityToPaymentObject } from './interfaces/routes/payment';
import { isPayment, Payment } from './entities/Payment';

const roleId = '37a24f4d-156a-ea18-6943-d69386b6afb6' // TODO Put these in env variables
const secretId = '9e683092-c032-0a0f-2908-016c0d3fcccf'

export const DI = {} as {
  orm: MikroORM,
  em: EntityManager,
  userRepository: EntityRepository<User>,
  paymentRepository: EntityRepository<Payment>,
};

const app = express();
const port = 3000;

const ERROR_VALIDATION_CODE = 'ERR_VALIDATION';
const ERROR_VALIDATION_MESSAGE = 'Validation failed';

const vaultOptions = {
  apiVersion: 'v1', // default
  endpoint: 'http://127.0.0.1:8200', // default
};

const JWT_SINGING_KEY = 'A VERY SECRET SIGNING KEY'; // TODO Put this in the vault (future todo use certificate)

(async () => {

  // get new instance of the client
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
  app.use((req, res, next) => RequestContext.create(DI.orm.em, next));
  
  app.get('/', (req: express.Request, res: express.Response) => {
    res.send('Hello World!')
  });
  
  app.post('/v1/authenticate/', async function (req: AuthenticateRequest, res: AuthenticateResponse & ErrorResponse) {
    // https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#intersection-types

    if (req.body === undefined || 
      req.body.username === undefined || req.body.username.trim().length === 0 || 
      req.body.password === undefined || req.body.password.trim().length === 0) {
      const detail = new ErrorDetail("Missing username and password")
  
      res.status(401)
      .json({
        code: ERROR_VALIDATION_CODE, 
        message: ERROR_VALIDATION_MESSAGE, 
        details: [detail]
      });
    }

    const user = await DI.userRepository.findOne({username : req.body.username});

    if (!user || 
      req.body.password != user.password) {
      const detail = new ErrorDetail("Wrong username or password")
  
      res.status(401)
      .json({
        code: ERROR_VALIDATION_CODE, 
        message: ERROR_VALIDATION_MESSAGE, 
        details: [detail]
      });
    } else {
      const expiresIn = '1h'

      const userJWT : UserJWT = {
        userId : user._id.toString()
      }

      const token = await jsonwebtoken.sign(
        userJWT, 
        JWT_SINGING_KEY,
        { expiresIn: expiresIn }
      );
      res.json({
        authToken: token,
        expiresIn: expiresIn
      });
    }
      
    res.send()
  });

  app.get('/protected', 
    expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] }),
    (req: express.Request, res: express.Response) => {
    const userJWT = req.user;
    if (isUserJWT(userJWT)) {
      res.send('Hello Protected World! ' + userJWT.userId)
    } else {
      res.send('Something went wrong.')
    }
  });

  app.post('/v1/payments', 
    expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] }),
    async function (req: CreatePaymentRequest, res: CreatePaymentResponse) {

      const reqPayment = new Payment(req.body);
      await DI.paymentRepository.persist(reqPayment).flush();
      const resPayment = await DI.paymentRepository.findOne({ _id: reqPayment._id });

      if (isPayment(resPayment)) {
        const paymentObject = MapPaymentEntityToPaymentObject(resPayment);
        res.json(paymentObject);
      }
  });

  app.get('/v1/payment/:id', 
    expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] }),
    async function (req: GetPaymentRequest, res: GetPaymentResponse) {

      const paymentId = req.params.id;

      const resPayment = await DI.paymentRepository.findOne({ _id: paymentId });

      if (isPayment(resPayment)) {
        const paymentObject = MapPaymentEntityToPaymentObject(resPayment);
        res.json(paymentObject);
      }

      res.send(`Payment '${paymentId}' not found.`);
  });
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`)
  });

})();
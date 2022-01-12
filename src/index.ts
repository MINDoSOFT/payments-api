
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
import { ApprovePaymentRequest, ApprovePaymentResponse, CancelPaymentRequest, CancelPaymentResponse, CreatePaymentRequest, CreatePaymentResponse, GetPaymentRequest, GetPaymentResponse, ListPaymentsRequest, ListPaymentsResponse, MapPaymentEntityToPaymentObject } from './interfaces/routes/payment';
import { isPayment, Payment } from './entities/Payment';

import {
	StatusCodes
} from 'http-status-codes';

import bcrypt = require('bcrypt');

import { ValidationError } from './errors/ValidationError.js';
import { PropertyRequiredError } from './errors/PropertyRequiredError.js';
import { PaymentObject } from './pocos/payment-object';

const roleId = '6cfd67ad-08cb-a943-08f3-12993c25e615' // TODO Put these in env variables
const secretId = '28930878-5b00-b4ee-2574-abfd467e39c8'

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
const ERROR_CANNOT_APPROVE_CODE = 'ERR_CANNOT_APPROVE';
const ERROR_CANNOT_APPROVE_MESSAGE = 'Cannot approve a payment that has already been cancelled';
const ERROR_CANNOT_CANCEL_CODE = 'ERR_CANNOT_CANCEL';
const ERROR_CANNOT_CANCEL_MESSAGE = 'Cannot cancel a payment that has already been approved';
const ERROR_ALREADY_APPROVED_CODE = 'ERR_ALREADY_APPROVED';
const ERROR_ALREADY_APPROVED_MESSAGE = 'This payment was already approved';
const ERROR_ALREADY_CANCELLED_CODE = 'ERR_ALREADY_CANCELLED';
const ERROR_ALREADY_CANCELLED_MESSAGE = 'This payment was already cancelled';

const vaultOptions = {
  apiVersion: 'v1', // default
  endpoint: 'http://127.0.0.1:8200', // default
};

const JWT_SINGING_KEY = 'A VERY SECRET SIGNING KEY'; // TODO Put this in the vault (future todo use certificate)

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
  
  app.post('/v1/authenticate/', async function (req: AuthenticateRequest, res: AuthenticateResponse & ErrorResponse) {
    // https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#intersection-types

    if (req.body === undefined || 
      req.body.username === undefined || req.body.username.trim().length === 0 || 
      req.body.password === undefined || req.body.password.trim().length === 0) {
      const detail = new ErrorDetail("Missing username and password")
  
      return res.status(StatusCodes.BAD_REQUEST)
      .json({
        code: ERROR_VALIDATION_CODE, 
        message: ERROR_VALIDATION_MESSAGE, 
        details: [detail]
      });
    }

    const user = await DI.userRepository.findOne({username : req.body.username});

    if (!user || 
      !bcrypt.compareSync(req.body.password, user.password)) {
      const detail = new ErrorDetail("Wrong username or password")
  
      return res.status(StatusCodes.UNAUTHORIZED)
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
      return res.status(StatusCodes.OK).json({
        authToken: token,
        expiresIn: expiresIn
      });
    }
  });

  app.get('/protected', 
    expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] }),
    (req: express.Request, res: express.Response) => {
    const userJWT = req.user;
    if (isUserJWT(userJWT)) {
      return res.status(StatusCodes.OK).send('Hello Protected World! ' + userJWT.userId)
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Something went wrong.')
    }
  });

  app.get('/v1/payments', 
    expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] }),
    async function (_req: ListPaymentsRequest, res: ListPaymentsResponse) {

      try {
        const payments = await DI.paymentRepository.findAll();
        const paymentObjects : PaymentObject[] = [];
        payments.forEach(payment => {
          paymentObjects.push(MapPaymentEntityToPaymentObject(payment))
        });

        return res.status(StatusCodes.OK).json(paymentObjects);
      } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error loading payments:` + error);
      }
  });

  app.post('/v1/payments', 
    expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] }),
    async function (req: CreatePaymentRequest, res: CreatePaymentResponse & ErrorResponse) {

      let reqPaymentId : string;

      try {
        const reqPayment = new Payment(req.body);
        reqPaymentId = reqPayment._id;

        await DI.paymentRepository.persist(reqPayment).flush();  
      } catch (error) {
        if (error instanceof ValidationError) {

          let detail = new ErrorDetail(error.message)

          if (error instanceof PropertyRequiredError) {
            detail = new ErrorDetail(error.message, [error.property], undefined)
          }

          return res.status(StatusCodes.BAD_REQUEST)
          .json({
            code: ERROR_VALIDATION_CODE, 
            message: ERROR_VALIDATION_MESSAGE, 
            details: [detail]
          });
        }
        else {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error persisting payment:` + error);
        }
      }

      try {
        const resPayment = await DI.paymentRepository.findOne({ _id: reqPaymentId });

        if (isPayment(resPayment)) {
          const paymentObject = MapPaymentEntityToPaymentObject(resPayment);
          return res.status(StatusCodes.OK).json(paymentObject);
        }        
      } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error retrieving created payment:` + error);
      }
  });

  app.get('/v1/payment/:id', 
    expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] }),
    async function (req: GetPaymentRequest, res: GetPaymentResponse) {

      const paymentId = req.params.id;

      try {
        const resPayment = await DI.paymentRepository.findOne({ _id: paymentId });

        if (isPayment(resPayment)) {
          const paymentObject = MapPaymentEntityToPaymentObject(resPayment);
          return res.status(StatusCodes.OK).json(paymentObject);
        }
      } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error loading payment '${paymentId}':` + error);
      }

      return res.status(StatusCodes.NOT_FOUND).send(`Payment '${paymentId}' not found.`);
  });

  app.put('/v1/payment/:id/approve', 
    expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] }),
    async function (req: ApprovePaymentRequest, res: ApprovePaymentResponse & ErrorResponse) {

      const paymentId = req.params.id;

      try {
        const payment = await DI.paymentRepository.findOne({ _id: paymentId });

        if (isPayment(payment)) {
          if (payment.status.trim().toLowerCase() == 'cancelled') {
            return res.status(StatusCodes.BAD_REQUEST)
            .json({
              code: ERROR_CANNOT_APPROVE_CODE, 
              message: ERROR_CANNOT_APPROVE_MESSAGE
            });
          } else if (payment.status.trim().toLowerCase() == 'approved') {
            return res.status(StatusCodes.BAD_REQUEST)
            .json({
              code: ERROR_ALREADY_APPROVED_CODE, 
              message: ERROR_ALREADY_APPROVED_MESSAGE
            });
          }

          payment.status = 'approved';

          await DI.paymentRepository.persist(payment).flush();  
          return res.status(StatusCodes.OK).send();
        }
      } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error loading payment '${paymentId}':` + error);
      }

      return res.status(StatusCodes.NOT_FOUND).send(`Payment '${paymentId}' not found.`);
  });

  app.put('/v1/payment/:id/cancel', 
    expressjwt({ secret: JWT_SINGING_KEY, algorithms: ['HS256'] }),
    async function (req: CancelPaymentRequest, res: CancelPaymentResponse & ErrorResponse) {

      const paymentId = req.params.id;

      try {
        const payment = await DI.paymentRepository.findOne({ _id: paymentId });

        if (isPayment(payment)) {
          if (payment.status.trim().toLowerCase() == 'approved') {
            return res.status(StatusCodes.BAD_REQUEST)
            .json({
              code: ERROR_CANNOT_CANCEL_CODE, 
              message: ERROR_CANNOT_CANCEL_MESSAGE
            });
          } else if (payment.status.trim().toLowerCase() == 'cancelled') {
            return res.status(StatusCodes.BAD_REQUEST)
            .json({
              code: ERROR_ALREADY_CANCELLED_CODE, 
              message: ERROR_ALREADY_CANCELLED_MESSAGE
            });
          }

          payment.status = 'cancelled';

          await DI.paymentRepository.persist(payment).flush();  
          return res.status(StatusCodes.OK).send();
        }
      } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(`Error loading payment '${paymentId}':` + error);
      }

      return res.status(StatusCodes.NOT_FOUND).send(`Payment '${paymentId}' not found.`);
  });
  
  app.listen(port, () => {
    console.log(`Payments-api listening on port ${port}!`)
  });

})();
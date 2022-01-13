
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

import { PaymentObject } from './pocos/payment-object';
import { UnauthorizedError } from 'express-jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';
import { ERROR_VALIDATION_CODE, ERROR_VALIDATION_MESSAGE, ERROR_CANNOT_APPROVE_CODE, ERROR_CANNOT_APPROVE_MESSAGE, ERROR_ALREADY_APPROVED_CODE, ERROR_ALREADY_APPROVED_MESSAGE, ERROR_CANNOT_CANCEL_CODE, ERROR_CANNOT_CANCEL_MESSAGE, ERROR_ALREADY_CANCELLED_CODE, ERROR_ALREADY_CANCELLED_MESSAGE, ERROR_AUTH_TOKEN_EXPIRED_CODE, ERROR_AUTH_TOKEN_EXPIRED_MESSAGE, ERROR_UNAUTHORIZED_CODE, ERROR_UNAUTHORIZED_MESSAGE } from './enums/api-error-codes';

const roleId = '5174662e-0e80-b298-d55d-6e17b6c4bc81' // TODO Put these in env variables
const secretId = 'c56ddff8-4316-bfac-9741-9eedfad26ded'

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
        if (error instanceof ZodError) {

          const details : ErrorDetail[] = [];
          error.issues.forEach(issue => {
            details.push(new ErrorDetail(issue.message, issue.path))
          });

          return res.status(StatusCodes.BAD_REQUEST)
          .json({
            code: ERROR_VALIDATION_CODE, 
            message: ERROR_VALIDATION_MESSAGE, 
            details: details
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
          return res.status(StatusCodes.CREATED).json(paymentObject);
        } else {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Something went wrong.')
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
  
  app.use(function (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
    // This must come after any routes, otherwise it is not called !
    if (err instanceof UnauthorizedError) {

      if (err.inner && err.inner instanceof TokenExpiredError) {
        return res.status(StatusCodes.UNAUTHORIZED)
          .json({
          code: ERROR_AUTH_TOKEN_EXPIRED_CODE,
          message: ERROR_AUTH_TOKEN_EXPIRED_MESSAGE
        });
      }

      return res.status(StatusCodes.UNAUTHORIZED)
        .json({
        code: ERROR_UNAUTHORIZED_CODE,
        message: ERROR_UNAUTHORIZED_MESSAGE
      });
    }

    return next();
  })

  app.listen(port, () => {
    console.log(`Payments-api listening on port ${port}!`)
  });

})();
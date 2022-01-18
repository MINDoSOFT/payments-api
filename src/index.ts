import bodyParser from 'body-parser';
import express from 'express';
import 'reflect-metadata';
import {
  RequestContext
} from '@mikro-orm/core';

import expressjwt = require('express-jwt');

import { StatusCodes } from 'http-status-codes';

import { AuthenticateController } from './controllers/authenticate-controller';
import { JWT_SINGING_KEY } from './constants';
import { PaymentsController } from './controllers/payments-controller';
import { UserService } from './services/user-service';
import { JWTService } from './services/jwt-service';
import { PaymentService } from './services/payment-service';
import { MongoService } from './services/mongo-service';



const expressJwtHandler = expressjwt({
  secret: JWT_SINGING_KEY,
  algorithms: ['HS256']
});

export const app = express();

export function setupRoutes(  
  mongoService: MongoService) {

  app.use(bodyParser.json());
  app.use((_req, _res, next) => RequestContext.create(mongoService.getEntityManager(), next));

  app.get('/', (_req: express.Request, res: express.Response) => {
    return res.status(StatusCodes.OK).send('Hello World!');
  });

  const userService = new UserService(mongoService);
  const jwtService = new JWTService(userService);
  const paymentService = new PaymentService(mongoService);

  const authenticateController = new AuthenticateController(
    userService,
    jwtService
  );

  app.post('/v1/authenticate/', authenticateController.authenticateUser);

  const paymentsController = new PaymentsController(paymentService);

  app.get('/v1/payments', expressJwtHandler, paymentsController.getPayments);

  app.post('/v1/payments', expressJwtHandler, paymentsController.createPayment);

  app.get('/v1/payment/:id', expressJwtHandler, paymentsController.getPayment);

  app.put(
    '/v1/payment/:id/approve',
    expressJwtHandler,
    paymentsController.approvePayment
  );

  app.put(
    '/v1/payment/:id/cancel',
    expressJwtHandler,
    paymentsController.cancelPayment
  );

  app.use(authenticateController.handleAuthenticationError);

  }

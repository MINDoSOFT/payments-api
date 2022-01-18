import bodyParser from 'body-parser';
import express from 'express';
import 'reflect-metadata';
import {
  RequestContext
} from '@mikro-orm/core';

import expressjwt = require('express-jwt');

import { StatusCodes } from 'http-status-codes';

import { AuthenticateController } from './controllers/authenticate-controller';
import { APPROVE_PAYMENT_ENDPOINT, AUTHENTICATE_ENDPOINT, CANCEL_PAYMENT_ENDPOINT, CREATE_PAYMENT_ENDPOINT, GET_PAYMENTS_ENDPOINT, GET_PAYMENT_ENDPOINT, HELLO_WORLD_ENDPOINT, JWT_SINGING_KEY } from './constants';
import { PaymentsController } from './controllers/payments-controller';
import { UserService } from './services/user-service';
import { JWTService } from './services/jwt-service';
import { PaymentService } from './services/payment-service';
import { MongoService } from './services/mongo-service';

export class Index {
  private static instance: Index;

  private mongoService : MongoService | undefined;
  private userService : UserService | undefined;
  private jwtService : JWTService | undefined;
  private paymentService : PaymentService | undefined;
  private app;
  private expressJwtHandler = expressjwt({
    secret: JWT_SINGING_KEY,
    algorithms: ['HS256']
  });

  private authenticateController : AuthenticateController | undefined;
  private paymentsController : PaymentsController | undefined;

  private constructor() {
    this.app = express();
  }

  public static getInstance(): Index {
    if (!Index.instance) {
      Index.instance = new Index();
    }

    return Index.instance;
  }

  init = (mongoService: MongoService) => {
    this.mongoService = mongoService;
    this.userService = new UserService(mongoService);
    this.jwtService = new JWTService(this.userService);
    this.paymentService = new PaymentService(mongoService);

    this.authenticateController = new AuthenticateController(
      this.userService,
      this.jwtService
    );

    this.paymentsController = new PaymentsController(this.paymentService);
  }

  setupRoutes = () => {
    let mongoService : MongoService;

    if (!this.mongoService) {
      throw new Error('Mongo service is undefined');
    } else {
      mongoService = this.mongoService;
    }
    if (!this.authenticateController) throw new Error('Authenticate controller is undefined');
    if (!this.paymentsController) throw new Error('Payments controller is undefined');

    this.app.use(bodyParser.json());
    this.app.use((_req, _res, next) => RequestContext.create(mongoService.getEntityManager(), next));

    this.app.get(HELLO_WORLD_ENDPOINT, (_req: express.Request, res: express.Response) => {
      return res.status(StatusCodes.OK).send('Hello World!');
    });

    this.app.post(AUTHENTICATE_ENDPOINT, this.authenticateController.authenticateUser);

    this.app.get(GET_PAYMENTS_ENDPOINT, this.expressJwtHandler, this.paymentsController.getPayments);

    this.app.post(CREATE_PAYMENT_ENDPOINT, this.expressJwtHandler, this.paymentsController.createPayment);

    this.app.get(GET_PAYMENT_ENDPOINT, this.expressJwtHandler, this.paymentsController.getPayment);

    this.app.put(
      APPROVE_PAYMENT_ENDPOINT,
      this.expressJwtHandler,
      this.paymentsController.approvePayment
    );

    this.app.put(
      CANCEL_PAYMENT_ENDPOINT,
      this.expressJwtHandler,
      this.paymentsController.cancelPayment
    );

    this.app.use(this.authenticateController.handleAuthenticationError);

  }

  getApp = () => {
    return this.app;
  }

  getUserService = () => {
    if (!this.userService) {
      throw new Error('User service is undefined');
    }
    return this.userService;
  }

  getJWTService = () => {
    if (!this.jwtService) {
      throw new Error('JWT service is undefined');
    }
    return this.jwtService;
  }

}
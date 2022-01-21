import { StatusCodes } from 'http-status-codes';

import {
  ERROR_AUTH_TOKEN_EXPIRED_CODE,
  ERROR_AUTH_TOKEN_EXPIRED_MESSAGE,
  ERROR_UNAUTHORIZED_CODE,
  ERROR_UNAUTHORIZED_MESSAGE,
  ERROR_VALIDATION_CODE,
  ERROR_VALIDATION_MESSAGE
} from '../enums/api-error-codes';
import {
  AuthenticateRequest,
  AuthenticateResponse
} from '../interfaces/routes/authenticate';
import { ErrorResponse } from '../interfaces/routes/error';

import express from 'express';
import { UnauthorizedError } from 'express-jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { UserService } from '../services/user-service';
import { JWTService } from '../services/jwt-service';
import { ErrorDetail } from '../pocos/error-response-object';

export const MISSING_USERNAME_OR_PASSWORD_MESSAGE = 'Missing username or password';
export const WRONG_USERNAME_OR_PASSWORD_MESSAGE = 'Wrong username or password';

export class AuthenticateController {
  private userService: UserService;
  private jwtService: JWTService;

  constructor(userService: UserService, jwtService: JWTService) {
    this.userService = userService;
    this.jwtService = jwtService;
  }

  authenticateUser = async (
    req: AuthenticateRequest,
    res: AuthenticateResponse & ErrorResponse
  ) => {
    // https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#intersection-types

    if (
      req.body === undefined ||
      req.body.username === undefined ||
      req.body.username.trim().length === 0 ||
      req.body.password === undefined ||
      req.body.password.trim().length === 0
    ) {
      const detail = new ErrorDetail(MISSING_USERNAME_OR_PASSWORD_MESSAGE);

      return res.status(StatusCodes.BAD_REQUEST).json({
        code: ERROR_VALIDATION_CODE,
        message: ERROR_VALIDATION_MESSAGE,
        details: [detail]
      });
    }

    try {
      const validateUserPasswordResult = await this.userService.validateUserPassword({
        username: req.body.username,
        plainTextPassword: req.body.password
      });

      switch (validateUserPasswordResult.type) {
        case 'ValidateUserPasswordSuccess': {
          const getUserJWTResult = await this.jwtService.getUserJWT({
            username: req.body.username
          });

          if (getUserJWTResult.type !== 'GetUserJWTSuccess') {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
              .send('Unexpected error while authenticating user (in getting JWT)');
          }

          return res.status(StatusCodes.OK).json({
            authToken: getUserJWTResult.token,
            expiresIn: getUserJWTResult.expiresIn
          });
        }
        case 'UserPasswordInvalidError': {
          const detail = new ErrorDetail(WRONG_USERNAME_OR_PASSWORD_MESSAGE);

          return res.status(StatusCodes.UNAUTHORIZED).json({
            code: ERROR_VALIDATION_CODE,
            message: ERROR_VALIDATION_MESSAGE,
            details: [detail]
          });
        }
        case 'UnexpectedError':
          return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .send('Unexpected error while authenticating user');
      }
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send('Unexpected error while authenticating user (in controller)');
    }
  };

  handleAuthenticationError = (
    err: Error,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // This must come after any routes, otherwise it is not called !
    if (err instanceof UnauthorizedError) {
      if (err.inner && err.inner instanceof TokenExpiredError) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          code: ERROR_AUTH_TOKEN_EXPIRED_CODE,
          message: ERROR_AUTH_TOKEN_EXPIRED_MESSAGE
        });
      }

      return res.status(StatusCodes.UNAUTHORIZED).json({
        code: ERROR_UNAUTHORIZED_CODE,
        message: ERROR_UNAUTHORIZED_MESSAGE
      });
    }

    return next();
  };
}

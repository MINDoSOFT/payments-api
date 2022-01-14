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
import { ErrorDetail, ErrorResponse } from '../interfaces/routes/error';

import express from 'express';
import { UnauthorizedError } from 'express-jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { UserService } from '../services/user-service';
import { JWTService } from '../services/jwt-service';

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
      const detail = new ErrorDetail('Missing username and password');

      return res.status(StatusCodes.BAD_REQUEST).json({
        code: ERROR_VALIDATION_CODE,
        message: ERROR_VALIDATION_MESSAGE,
        details: [detail]
      });
    }

    try {
      await this.userService.validateUserPassword(
        req.body.username,
        req.body.password
      );

      const [token, expiresIn] = await this.jwtService.getUserJWT(
        req.body.username
      );

      return res.status(StatusCodes.OK).json({
        authToken: token,
        expiresIn: expiresIn
      });
    } catch (error) {
      if (
        error instanceof UserNotFoundError ||
        error instanceof UserPasswordInvalidError
      ) {
        const detail = new ErrorDetail('Wrong username or password');

        return res.status(StatusCodes.UNAUTHORIZED).json({
          code: ERROR_VALIDATION_CODE,
          message: ERROR_VALIDATION_MESSAGE,
          details: [detail]
        });
      } else {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(`Unhandled error while authenticating user:` + error);
      }
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

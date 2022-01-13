import { EntityRepository } from "@mikro-orm/core";
import { StatusCodes } from "http-status-codes";
import { JWT_SINGING_KEY } from "../constants";
import { User } from "../entities/User";
import { ERROR_AUTH_TOKEN_EXPIRED_CODE, ERROR_AUTH_TOKEN_EXPIRED_MESSAGE, ERROR_UNAUTHORIZED_CODE, ERROR_UNAUTHORIZED_MESSAGE, ERROR_VALIDATION_CODE, ERROR_VALIDATION_MESSAGE } from "../enums/api-error-codes";
import { AuthenticateRequest, AuthenticateResponse } from "../interfaces/routes/authenticate";
import { ErrorDetail, ErrorResponse } from "../interfaces/routes/error";
import { isUserJWT, UserJWT } from "../interfaces/UserJWT";
import jsonwebtoken = require('jsonwebtoken');
import bcrypt = require('bcrypt');
import express from 'express';
import { UnauthorizedError } from "express-jwt";
import { TokenExpiredError } from "jsonwebtoken";

export class AuthenticateController {
  private userRepository : EntityRepository<User>

  constructor(userRepository : EntityRepository<User>) {
    this.userRepository = userRepository;
  }

  authenticateUser = async (req: AuthenticateRequest, res: AuthenticateResponse & ErrorResponse) => {
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
  
      const user = await this.userRepository.findOne({username : req.body.username});
  
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
  };

  helloProtectedWorld = (req: express.Request, res: express.Response) => {
    const userJWT = req.user;
    if (isUserJWT(userJWT)) {
      return res.status(StatusCodes.OK).send('Hello Protected World! ' + userJWT.userId)
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('Something went wrong.')
    }
  }

  handleAuthenticationError = (err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
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
  }
}
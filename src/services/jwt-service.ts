import { UserJWT } from '../interfaces/UserJWT';
import { UserService } from './user-service';
import jsonwebtoken = require('jsonwebtoken');
import { JWT_SINGING_KEY } from '../constants';
import { UserObject } from '../pocos/user-object';

type GetUserJWTInput = {
  username: string;
}

type GetUserJWTSuccess = {
  type: 'GetUserJWTSuccess'
  token: string;
  expiresIn: string;
}

type UnexpectedError = {
  type: 'UnexpectedError'
}

type GetUserExpiredJWTInput = {
  username: string;
}

type GetUserExpiredJWTSuccess = {
  type: 'GetUserExpiredJWTSuccess';
  token: string;
  expiresIn: string;
}


export type GetUserJWTResult = GetUserJWTSuccess 
  | UnexpectedError;

export type GetUserExpiredJWTResult = GetUserExpiredJWTSuccess 
  | UnexpectedError;

export class JWTService {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  private async getJWT (user: UserObject, expiresIn: string) : Promise<string> {
    const userJWT: UserJWT = {
      userId: user.id
    };

    const token = await jsonwebtoken.sign(userJWT, JWT_SINGING_KEY, {
      expiresIn: expiresIn
    });

    return token;
  }

  getUserJWT = async (input: GetUserJWTInput): Promise<GetUserJWTResult> => {
    try {
      const getUserResult = await this.userService.getUser({
        username: input.username
      });

      if (getUserResult.type !== 'GetUserSuccess') 
        return {
          type: 'UnexpectedError'
        }

      const expiresIn = '1h';

      const token = await this.getJWT(getUserResult.user, expiresIn);

      return {
        type: 'GetUserJWTSuccess',
        token, 
        expiresIn 
      };
    } catch (error) {
      return {
        type: 'UnexpectedError'
      }
    }
  };

  getUserExpiredJWT = async (input: GetUserExpiredJWTInput): Promise<GetUserExpiredJWTResult> => {
    try {
      const getUserResult = await this.userService.getUser({
        username: input.username
      });
      if (getUserResult.type !== 'GetUserSuccess') 
        return {
          type: 'UnexpectedError'
        }

      const expiresIn = '-1h';

      const token = await this.getJWT(getUserResult.user, expiresIn);

      return {
        type: 'GetUserExpiredJWTSuccess',
        token, 
        expiresIn 
      };
    } catch (error) {
      return {
        type: 'UnexpectedError'
      }
    }
  };
}
import { UserJWT } from '../interfaces/UserJWT';
import { UserService } from './user-service';
import jsonwebtoken = require('jsonwebtoken');
import { JWT_SINGING_KEY } from '../constants';
import {
  getUserExpiredJWTInput,
  getUserExpiredJWTOutput,
  getUserJWTInput,
  getUserJWTOutput
} from '../interfaces/services/jwt-service-interface';
import { UserObject } from '../pocos/user-object';

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

  getUserJWT = async (input: getUserJWTInput): Promise<getUserJWTOutput> => {
    const getUserOutput = await this.userService.getUser({
      username: input.username
    });
    const expiresIn = '1h';

    const token = await this.getJWT(getUserOutput.user, expiresIn);

    return { token, expiresIn };
  };

  getUserExpiredJWT = async (input: getUserExpiredJWTInput): Promise<getUserExpiredJWTOutput> => {
    const getUserOutput = await this.userService.getUser({
      username: input.username
    });
    const expiresIn = '-1h';

    const token = await this.getJWT(getUserOutput.user, expiresIn);

    return { token, expiresIn };
  };
}

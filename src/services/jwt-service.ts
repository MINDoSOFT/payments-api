import { UserJWT } from '../interfaces/UserJWT';
import { UserService } from './user-service';
import jsonwebtoken = require('jsonwebtoken');
import { JWT_SINGING_KEY } from '../constants';
import {
  getUserJWTInput,
  getUserJWTOutput
} from '../interfaces/services/jwt-service-interface';

export class JWTService {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  getUserJWT = async (input: getUserJWTInput): Promise<getUserJWTOutput> => {
    const getUserOutput = await this.userService.getUser({
      username: input.username
    });
    const user = getUserOutput.user;

    const expiresIn = '1h';

    const userJWT: UserJWT = {
      userId: user._id.toString()
    };

    const token = await jsonwebtoken.sign(userJWT, JWT_SINGING_KEY, {
      expiresIn: expiresIn
    });

    return { token, expiresIn };
  };
}

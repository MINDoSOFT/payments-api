import { UserJWT } from '../interfaces/UserJWT';
import { UserService } from './user-service';
import jsonwebtoken = require('jsonwebtoken');
import { JWT_SINGING_KEY } from '../constants';

export class JWTService {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  getUserJWT = async (username: string) => {
    const user = await this.userService.getUser(username);

    const expiresIn = '1h';

    const userJWT: UserJWT = {
      userId: user._id.toString()
    };

    const token = await jsonwebtoken.sign(userJWT, JWT_SINGING_KEY, {
      expiresIn: expiresIn
    });

    return [token, expiresIn];
  };
}

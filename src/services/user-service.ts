import { EntityRepository } from '@mikro-orm/core';
import { User } from '../entities/User';
import bcrypt = require('bcrypt');
import {
  UserNotFoundError,
  UserPasswordInvalidError
} from '../errors/user-service-error';
import {
  getUserInput,
  getUserOutput,
  validateUserPasswordInput,
  validateUserPasswordOutput
} from '../interfaces/services/user-service-interface';
import { MongoService } from './mongo-service';

export class UserService {
  private userRepository: EntityRepository<User>;

  constructor(mongoService : MongoService) {
    this.userRepository = mongoService.getUserRepository();
  }

  getUser = async (input: getUserInput): Promise<getUserOutput> => {
    const user = await this.userRepository.findOne({
      username: input.username
    });

    if (!user) throw new UserNotFoundError(input.username);

    return { user };
  };

  validateUserPassword = async (
    input: validateUserPasswordInput
  ): Promise<validateUserPasswordOutput> => {
    const getUserOutput = await this.getUser({ username: input.username });
    const user = getUserOutput.user;

    if (!bcrypt.compareSync(input.plainTextPassword, user.password))
      throw new UserPasswordInvalidError(input.username);

    return { isValid: true };
  };
}

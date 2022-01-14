import { EntityRepository } from '@mikro-orm/core';
import { User } from '../entities/User';
import bcrypt = require('bcrypt');
import { UserNotFoundError, UserPasswordInvalidError } from '../errors/user-service-error';

export class UserService {
  private userRepository: EntityRepository<User>;

  constructor(userRepository: EntityRepository<User>) {
    this.userRepository = userRepository;
  }

  getUser = async (username: string) => {
    const user = await this.userRepository.findOne({ username: username });

    if (!user) throw new UserNotFoundError(username);

    return user;
  };

  validateUserPassword = async (
    username: string,
    plainTextPassword: string
  ) => {
    const user = await this.getUser(username);

    if (!bcrypt.compareSync(plainTextPassword, user.password))
      throw new UserPasswordInvalidError(username);

    return true;
  };
}

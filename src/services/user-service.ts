import bcrypt = require('bcrypt');
import {
  UserNotFoundError,
  UserPasswordInvalidError
} from '../errors/user-service-error';
import {
  addUserForTestingInput,
  addUserForTestingOutput,
  getUserInput,
  getUserOutput,
  validateUserPasswordInput,
  validateUserPasswordOutput
} from '../interfaces/services/user-service-interface';
import { IUserRepo } from '../repos/user-repo';
import { CreateUserObject } from '../pocos/user-object';

export class UserService {
  private userRepository: IUserRepo;

  constructor(userRepository : IUserRepo) {
    this.userRepository = userRepository;
  }

  getUser = async (input: getUserInput): Promise<getUserOutput> => {
    const user = await this.userRepository.findByUsername(input.username);

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

  addUserForTesting = async (input : addUserForTestingInput): Promise<addUserForTestingOutput> => {
    if (! await this.userRepository.findByUsername(input.username)) {
      const userToCreate : CreateUserObject = {
        username : input.username,
        plaintextPassword : input.plaintextPassword
      }
      const user = await this.userRepository.create(userToCreate);
      console.log(`Created user: ${user.username}.`);
    } else {
      console.log(`User: ${input.username} already exists.`);
    }

    return { created : true };
  }
}

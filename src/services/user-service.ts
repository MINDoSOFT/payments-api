import bcrypt = require('bcrypt');
import { IUserRepo } from '../repos/user-repo';
import { CreateUserObject, UserObject } from '../pocos/user-object';

type GetUserInput = {
  username: string;
}

type GetUserSuccess = {
  type: 'GetUserSuccess';
  user: UserObject;
}

type UserNotFoundError = {
  type: 'UserNotFoundError';
  message: string;
}

type UnexpectedError = {
  type: 'UnexpectedError'
}

type ValidateUserPasswordInput = {
  username: string;
  plainTextPassword: string;
}

type ValidateUserPasswordSuccess = {
  type:'ValidateUserPasswordSuccess'
}

type UserPasswordInvalidError = {
  type: 'UserPasswordInvalidError';
  message: string;
}

type AddUserForTestingInput = {
  username: string;
  plaintextPassword: string;
}

type AddUserForTestingSuccess = {
  type: 'AddUserForTestingSuccess'
}

type UserAlreadyExistsError = {
  type: 'UserAlreadyExistsError';
  message: string;
}


export type GetUserResult = GetUserSuccess 
  | UserNotFoundError 
  | UnexpectedError;

export type ValidateUserPasswordResult = ValidateUserPasswordSuccess 
  | UserPasswordInvalidError 
  | UnexpectedError;

export type AddUserForTestingResult = AddUserForTestingSuccess 
  | UserAlreadyExistsError 
  | UnexpectedError;

export class UserService {
  private userRepository: IUserRepo;

  constructor(userRepository : IUserRepo) {
    this.userRepository = userRepository;
  }

  getUser = async (input: GetUserInput): Promise<GetUserResult> => {
    try {
      const user = await this.userRepository.findByUsername(input.username);

      if (!user) {
        return {
          type: 'UserNotFoundError',
          message: 'Could not find user with username: ' + input.username
        }
      }

      return { 
        type: 'GetUserSuccess', 
        user: user
      };
    } catch (error) {
      return {
        type: 'UnexpectedError'
      }
    }
  };

  validateUserPassword = async (
    input: ValidateUserPasswordInput
  ): Promise<ValidateUserPasswordResult> => {
    try {
      const errorMessage = 'Password does not match with password for username: ' + input.username;

      const getUserResult = await this.getUser({ username: input.username });
      if (getUserResult.type !== 'GetUserSuccess')
        return {
          type: 'UserPasswordInvalidError',
          message: errorMessage
        }
      const user = getUserResult.user;

      if (!bcrypt.compareSync(input.plainTextPassword, user.password))
        return {
          type: 'UserPasswordInvalidError',
          message: errorMessage
        }

      return { type: 'ValidateUserPasswordSuccess' }; 
    } catch (error) {
      return {
        type: 'UnexpectedError'
      }
    }
  };

  addUserForTesting = async (input : AddUserForTestingInput): Promise<AddUserForTestingResult> => {
    try {
      if (! await this.userRepository.findByUsername(input.username)) {
        const userToCreate : CreateUserObject = {
          username : input.username,
          plaintextPassword : input.plaintextPassword
        }
        await this.userRepository.create(userToCreate);
        return {
          type: 'AddUserForTestingSuccess'
        }
      } else {
        return {
          type: 'UserAlreadyExistsError',
          message: `User: ${input.username} already exists.`
        }
      }      
    } catch (error) {
      return {
        type: 'UnexpectedError'
      }
    }
  }
}

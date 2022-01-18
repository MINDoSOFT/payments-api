import { User } from '../../entities/User';

export interface getUserInput {
  username: string;
}

export interface getUserOutput {
  user: User;
}

export interface validateUserPasswordInput {
  username: string;
  plainTextPassword: string;
}

export interface validateUserPasswordOutput {
  isValid: boolean;
}

export interface addUserForTestingInput {
  username: string;
  plaintextPassword: string;
}

export interface addUserForTestingOutput {
  created: boolean;
}

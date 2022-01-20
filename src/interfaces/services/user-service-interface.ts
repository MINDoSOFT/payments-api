import { UserObject } from '../../pocos/user-object';

export interface getUserInput {
  username: string;
}

export interface getUserOutput {
  user: UserObject;
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

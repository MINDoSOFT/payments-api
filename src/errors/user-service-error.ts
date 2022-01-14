import { MyError } from './my-error';

export class UserNotFoundError extends MyError {
  username: string;
  constructor(username: string) {
    super('Could not find user with username: ' + username);
    this.username = username;
  }
}

export class UserPasswordInvalidError extends MyError {
  username: string;
  constructor(username: string) {
    super('Password does not match with password for username: ' + username);
    this.username = username;
  }
}

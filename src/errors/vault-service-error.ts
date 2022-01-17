import { MyError } from './my-error';

export class VaultCredentialsNotFoundError extends MyError {
  path: string;
  constructor(path: string) {
    super('Could not find vault credentials at path: ' + path);
    this.path = path;
  }
}
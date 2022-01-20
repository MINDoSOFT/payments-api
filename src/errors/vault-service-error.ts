import { MyError } from './my-error';

export class VaultNotInitialisedError extends MyError {
  constructor() {
    super('Vault service has not been initialised');
  }
}

export class VaultCredentialsNotFoundError extends MyError {
  path: string;
  constructor(path: string) {
    super('Could not find vault credentials at path: ' + path);
    this.path = path;
  }
}
import { MyError } from './my-error';

export class MongoNotInitialisedError extends MyError {
  constructor() {
    super('Mongo service has not been initialised');
  }
}
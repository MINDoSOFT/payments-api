import { Params } from 'express-serve-static-core';

export interface TypedRequestParams<T extends Params> extends Express.Request {
  params: T;
}

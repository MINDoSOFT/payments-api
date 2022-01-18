import { AuthenticateResponseObject } from '../../pocos/authenticate-response-object';
import { TypedRequestBody } from '../TypedRequestBody';
import { TypedResponseBody } from '../TypedResponseBody';

// tslint:disable-next-line:no-empty-interface
export type AuthenticateRequest = TypedRequestBody<{
  username: string;
  password: string;
}>;

// tslint:disable-next-line:no-empty-interface
export type AuthenticateResponse = TypedResponseBody<AuthenticateResponseObject>;

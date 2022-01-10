import { TypedRequestBody } from "../TypedRequestBody";
import { TypedResponseBody } from "../TypedResponseBody";

export interface AuthenticateRequest extends TypedRequestBody<{
    username: string,
    password: string
}> {}

export interface AuthenticateResponse extends TypedResponseBody<{
    authToken: string,
    expiresIn: string
}> {}
import { TypedResponseBody } from "../TypedResponseBody";

export interface ErrorResponse extends TypedResponseBody<{
    code: string,
    message: string,
    details?: ErrorDetail[]
}> {}

export class ErrorDetail {
    constructor(
        public message: string,
        public path?: (string | number)[],
        public value?: string
    ){}
}
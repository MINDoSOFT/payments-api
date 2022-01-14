import { TypedResponseBody } from '../TypedResponseBody';

export type ErrorResponse = TypedResponseBody<{
  code: string;
  message: string;
  details?: ErrorDetail[];
}>;

export class ErrorDetail {
  constructor(
    public message: string,
    public path?: (string | number)[],
    public value?: string
  ) {}
}

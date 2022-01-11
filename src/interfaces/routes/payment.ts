import { TypedRequestBody } from "../TypedRequestBody";
import { TypedResponseBody } from "../TypedResponseBody";

export interface CreatePaymentRequest extends TypedRequestBody<{
    payeeId: string,
    payerId: string,
    paymentSystem: string,
    paymentMethod: string,
    amount: number,
    currency: string,
    comment: string,
}> {}

export interface CreatePaymentResponse extends TypedResponseBody<{
    id: string
    payeeId: string,
    payerId: string,
    paymentSystem: string,
    paymentMethod: string,
    amount: number,
    currency: string,
    status: string,
    comment: string,
    created: string,
    updated: string,
}> {}
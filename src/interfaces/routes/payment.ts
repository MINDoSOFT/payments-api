import { Payment } from "../../entities/Payment";
import { CreatePaymentObject, PaymentObject } from "../../pocos/payment-object";
import { TypedRequestBody } from "../TypedRequestBody";
import { TypedRequestParams } from "../TypedRequestParams";
import { TypedResponseBody } from "../TypedResponseBody";

export interface CreatePaymentRequest extends TypedRequestBody<CreatePaymentObject> {}

export interface CreatePaymentResponse extends GetPaymentResponse {}

export interface GetPaymentRequest extends TypedRequestParams<{ id: string }> {}

export interface GetPaymentResponse extends TypedResponseBody<PaymentObject> {}

export function MapPaymentEntityToPaymentObject(payment : Payment) : PaymentObject {
    const paymentResponse = {
        id : payment._id,
        payeeId : payment.payeeId,
        payerId : payment.payerId,
        paymentSystem : payment.paymentSystem,
        paymentMethod : payment.paymentMethod,
        amount : payment.amount,
        currency : payment.currency,
        status : payment.status,
        comment : payment.comment,
        created : payment.createdAt.toUTCString(),
        updated : payment.updatedAt.toUTCString(),
      };
    return paymentResponse;
}
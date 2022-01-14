import { Payment } from '../../entities/Payment';
import { CreatePaymentObject, PaymentObject } from '../../pocos/payment-object';
import { PaymentSchema } from '../../schemas/payment-schema';
import { TypedRequestBody } from '../TypedRequestBody';
import { TypedRequestParams } from '../TypedRequestParams';
import { TypedResponseBody } from '../TypedResponseBody';

export type CreatePaymentRequest = TypedRequestBody<CreatePaymentObject>;
export type CreatePaymentResponse = GetPaymentResponse;

export type GetPaymentRequest = TypedRequestParams<{ id: string }>;
export type GetPaymentResponse = TypedResponseBody<PaymentObject>;

export type ListPaymentsRequest = TypedRequestParams<Record<string, never>>;
export type ListPaymentsResponse = TypedResponseBody<PaymentObject[]>;

export type ApprovePaymentRequest = TypedRequestParams<{ id: string }>;
export type ApprovePaymentResponse = TypedResponseBody<Record<string, never>>;

export type CancelPaymentRequest = TypedRequestParams<{ id: string }>;
export type CancelPaymentResponse = TypedResponseBody<Record<string, never>>;

export function MapPaymentEntityToPaymentObject(
  payment: Payment
): PaymentObject {
  const paymentResponse = {
    id: payment._id,
    payeeId: payment.payeeId,
    payerId: payment.payerId,
    paymentSystem: payment.paymentSystem,
    paymentMethod: payment.paymentMethod,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    comment: payment.comment,
    created: payment.createdAt,
    updated: payment.updatedAt
  };

  PaymentSchema.parse(paymentResponse);

  return paymentResponse;
}

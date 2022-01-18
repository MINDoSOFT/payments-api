import { CreatePaymentObject, PaymentObject } from '../../pocos/payment-object';

export interface getPaymentsOutput {
  payments: PaymentObject[];
}

export interface createPaymentInput {
  payment: CreatePaymentObject;
}

export interface createPaymentOutput {
  paymentId: string;
}

export interface getPaymentInput {
  paymentId: string;
}

export interface getPaymentOutput {
  payment: PaymentObject;
}

export interface approvePaymentInput {
  paymentId: string;
}

export interface approvePaymentOutput {
  approved: boolean;
}

export interface cancelPaymentInput {
  paymentId: string;
}

export interface cancelPaymentOutput {
  cancelled: boolean;
}

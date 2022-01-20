import { CreatePaymentObject, PaymentObject } from "../pocos/payment-object";

export interface IPaymentRepo {
  findById (id: string): Promise<PaymentObject | undefined>;
  list (): Promise<PaymentObject[]>;
  create (payment: CreatePaymentObject): Promise<PaymentObject>;
  update (payment: PaymentObject): Promise<boolean>;
}
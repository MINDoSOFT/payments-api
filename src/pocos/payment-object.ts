export interface CreatePaymentObject {
  payeeId: string;
  payerId: string;
  paymentSystem: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  comment: string;
}

export interface PaymentObject extends CreatePaymentObject {
  id: string;
  status: string;
  created: Date;
  updated: Date;
}

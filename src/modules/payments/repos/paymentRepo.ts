import { Nothing } from "../../../shared/types";
import { Payment } from "../domain/payment";

export interface IPaymentRepo {
  findById (id: string): Promise<Payment | Nothing>;
  save (payment: Payment): Promise<any>;
}
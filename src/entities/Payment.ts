import { BaseEntity, Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from 'uuid';
import { CreatePaymentRequest } from "../interfaces/routes/payment";

@Entity()
export class Payment extends BaseEntity<Payment, 'id'> {

    @PrimaryKey()
    id: string = v4();
  
    @Property()
    payeeId: string;
    
    @Property()
    payerId: string;

    @Property()
    paymentSystem: string;

    @Property()
    paymentMethod: string;

    @Property()
    amount: number;

    @Property()
    currency: string;

    @Property()
    comment: string;

    @Property()
    status: string = 'created';

    @Property()
    createdAt: Date = new Date();
  
    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

  constructor(payment: CreatePaymentRequest) {
    super();
    this.payeeId = payment.body.payeeId;
    this.payerId = payment.body.payerId;
    this.paymentSystem = payment.body.paymentSystem;
    this.paymentMethod = payment.body.paymentMethod;
    this.amount = payment.body.amount;
    this.currency = payment.body.currency;
    this.comment = payment.body.comment;
  }
}

export function isPayment(arg: any): arg is Payment {
    return arg.id !== undefined;
}
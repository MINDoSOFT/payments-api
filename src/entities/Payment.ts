import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { CreatePaymentObject } from '../pocos/payment-object';
import {
  CreatePaymentSchema,
  PaymentStatusEnum
} from '../schemas/payment-schema';

@Entity()
export class Payment extends BaseEntity<Payment, '_id'> {
  @PrimaryKey()
  _id: string = v4();

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
  status: string = PaymentStatusEnum.enum.created;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  constructor(payment: CreatePaymentObject) {
    super();

    if (!payment) throw Error('Missing payment');

    CreatePaymentSchema.parse(payment);

    this.payeeId = payment.payeeId;
    this.payerId = payment.payerId;
    this.paymentSystem = payment.paymentSystem;
    this.paymentMethod = payment.paymentMethod;
    this.amount = payment.amount;
    this.currency = payment.currency;
    this.comment = payment.comment;
  }
}

export function isPayment(arg: any): arg is Payment {
  return arg && arg.id;
}

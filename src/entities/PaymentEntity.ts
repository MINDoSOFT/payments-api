import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { Payment } from '../modules/payments/domain/payment';
import { CreatePaymentObject } from '../pocos/payment-object';
import {
  CreatePaymentSchema,
  PaymentStatusEnum
} from '../schemas/payment-schema';

@Entity()
export class PaymentEntity extends BaseEntity<PaymentEntity, '_id'> {
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

  constructor(payment: Payment) {
    super();

    if (!payment) throw Error('Missing payment');

    this.payeeId = payment.getPayeeId().props.value;
    this.payerId = payment.getPayerId().props.value;
    this.paymentSystem = payment.getPaymentSystem().props.value;
    this.paymentMethod = payment.getPaymentMethod().props.value;
    this.amount = payment.getAmount().props.value;
    this.currency = payment.getCurrency().props.value;
    this.comment = payment.getComment().props.value;
  }
}

export function isPaymentEntity(arg: any): arg is PaymentEntity {
  return arg && arg.id;
}

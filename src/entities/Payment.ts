import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { CreatePaymentObject, PaymentObject } from '../pocos/payment-object';
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

  public constructor(paymentToCreate: CreatePaymentObject) {
    super();

    if (!paymentToCreate) throw Error('Missing payment');

    CreatePaymentSchema.parse(paymentToCreate);

    this.payeeId = paymentToCreate.payeeId;
    this.payerId = paymentToCreate.payerId;
    this.paymentSystem = paymentToCreate.paymentSystem;
    this.paymentMethod = paymentToCreate.paymentMethod;
    this.amount = paymentToCreate.amount;
    this.currency = paymentToCreate.currency;
    this.comment = paymentToCreate.comment;
  }

  public mapEntityToObject() : PaymentObject {
    const paymentObject : PaymentObject = {
      ...this,
      id : this._id,
      status : this.status,
      created : this.createdAt,
      updated : this.updatedAt
    }
    return paymentObject;
  }
}

export function isPayment(arg: any): arg is Payment {
  return arg && arg.id;
}
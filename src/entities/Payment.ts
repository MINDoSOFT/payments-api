import { BaseEntity, Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { v4 } from 'uuid';
import { PropertyRequiredError } from "../errors/PropertyRequiredError";
import { CreatePaymentObject } from "../pocos/payment-object";

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
    status: string = 'created';

    @Property()
    createdAt: Date = new Date();
  
    @Property({ onUpdate: () => new Date() })
    updatedAt: Date = new Date();

  constructor(payment: CreatePaymentObject) {
    super();

    if (!payment) throw Error("Missing payment")

    // TODO Use reflection to loop through required properties

    if (!payment.payeeId || payment.payeeId.trim().length == 0) throw new PropertyRequiredError("payeeId")
    if (!payment.payerId || payment.payeeId.trim().length == 0) throw new PropertyRequiredError("payerId")
    if (!payment.paymentSystem || payment.payeeId.trim().length == 0) throw new PropertyRequiredError("paymentSystem")
    if (!payment.paymentMethod || payment.payeeId.trim().length == 0) throw new PropertyRequiredError("paymentMethod")
    if (!payment.amount) throw new PropertyRequiredError("amount")
    if (!payment.currency || payment.payeeId.trim().length == 0) throw new PropertyRequiredError("currency")
    if (!payment.comment || payment.payeeId.trim().length == 0) throw new PropertyRequiredError("comment")

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
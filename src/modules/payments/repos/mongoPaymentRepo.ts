import { EntityRepository } from "@mikro-orm/core";
import { PaymentEntity } from "../../../entities/PaymentEntity";
import { MongoService } from "../../../services/mongo-service";
import { Nothing } from "../../../shared/types"; 
import { Amount } from "../domain/amount";
import { Comment } from "../domain/comment";
import { Currency } from "../domain/currency";
import { PayeeId } from "../domain/payeeId";
import { PayerId } from "../domain/payerId";
import { Payment } from "../domain/payment";
import { PaymentMethod } from "../domain/paymentMethod";
import { PaymentSystem } from "../domain/paymentSystem";
import { IPaymentRepo } from "./paymentRepo";

export class MongoPaymentRepo implements IPaymentRepo {
  private paymentEntityManager : EntityRepository<PaymentEntity>;

  constructor (mongoService : MongoService) {
    // Here's where I'd set up my firebase instance
    this.paymentEntityManager = mongoService.getEntityManager().getRepository(PaymentEntity);
  }

  async findById (id: string): Promise<Payment | Nothing> {
    // And I'd use the firebase api to find the user by email
    const paymentEntity = await this.paymentEntityManager.findOne({ _id : id })
    if (paymentEntity == null)
      return '';
    return this.convertPaymentEntityToPayment(paymentEntity);
  }

  async save (payment: Payment): Promise<any> {
    // And I'd save the user to firebase in this method.
    const paymentEntity = this.convertPaymentToPaymentEntity(payment);
    await this.paymentEntityManager.persistAndFlush(paymentEntity);
    return true;
  }
  
  private convertPaymentEntityToPayment(paymentEntity : PaymentEntity) : Payment {
    // Validation logic
    const payerIdOrError = PayerId.create(paymentEntity.payerId);
    const payeeIdOrError = PayeeId.create(paymentEntity.payeeId);
    const paymentSystemOrError = PaymentSystem.create(paymentEntity.paymentSystem);
    const paymentMethodOrError = PaymentMethod.create(paymentEntity.paymentMethod);
    const amountOrError = Amount.create(paymentEntity.amount);
    const currencyOrError = Currency.create(paymentEntity.currency);
    const commentOrError = Comment.create(paymentEntity.comment);

    const paymentOrError = Payment.create({
      payeeId: payeeIdOrError.getValue() as PayeeId,
      payerId: payerIdOrError.getValue() as PayerId,
      paymentSystem: paymentSystemOrError.getValue() as PaymentSystem,
      paymentMethod: paymentMethodOrError.getValue() as PaymentMethod,
      amount: amountOrError.getValue() as Amount,
      currency: currencyOrError.getValue() as Currency,
      comment: commentOrError.getValue() as Comment
    });

    return paymentOrError.getValue() as Payment;
  }

  private convertPaymentToPaymentEntity(payment : Payment) : PaymentEntity {
    const paymentEntity = new PaymentEntity(payment);

    return paymentEntity;
  }

}
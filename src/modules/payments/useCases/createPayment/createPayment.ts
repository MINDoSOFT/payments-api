import { Result } from '../../../../shared/core/result';
import { UseCase } from '../../../../shared/core/useCase';
import { PayerId } from '../../domain/payerId';
import { PayeeId } from '../../domain/payeeId';
import { Amount } from '../../domain/amount';
import { Comment } from '../../domain/comment';
import { PaymentSystem } from '../../domain/paymentSystem';
import { PaymentMethod } from '../../domain/paymentMethod';
import { Payment } from '../../domain/payment';
import { IPaymentRepo } from '../../repos/paymentRepo';
import { Currency } from '../../domain/currency';

type CreatePaymentInput = {
  payeeId: string;
  payerId: string;
  paymentSystem: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  comment: string;
}

type CreatePaymentSuccess = {
  type: 'CreatePaymentSuccess'
}

type InvalidPaymentDetailsError = {
  type: 'InvalidPaymentDetailsError';
  message: string;
}

type UnexpectedError = {
  type: 'UnexpectedError'
}

export type CreatePaymentResult = CreatePaymentSuccess 
  | InvalidPaymentDetailsError
  | UnexpectedError;

export class CreatePayment implements UseCase<CreatePaymentInput, CreatePaymentResult> {
  private paymentRepo: IPaymentRepo;

  constructor (paymentRepo: IPaymentRepo) {
    this.paymentRepo = paymentRepo;
  }

  public async execute (input: CreatePaymentInput): Promise<CreatePaymentResult> {

    // Validation logic
    const payerIdOrError = PayerId.create(input.payerId);
    const payeeIdOrError = PayeeId.create(input.payeeId);
    const paymentSystemOrError = PaymentSystem.create(input.paymentSystem);
    const paymentMethodOrError = PaymentMethod.create(input.paymentMethod);
    const amountOrError = Amount.create(input.amount);
    const currencyOrError = Currency.create(input.currency);
    const commentOrError = Comment.create(input.comment);

    const combinedResult = Result.combine([ 
      payerIdOrError, payeeIdOrError, paymentSystemOrError, paymentMethodOrError, currencyOrError, commentOrError
    ]);

    if (combinedResult.isFailure) {
      return {
        type: 'InvalidPaymentDetailsError',
        message: combinedResult.errorValue()
      }
    }

    // TODO Don't know of a better way to do this
    const combinedResultForNumbers = Result.combine([ 
      amountOrError
    ]);

    if (combinedResultForNumbers.isFailure) {
      return {
        type: 'InvalidPaymentDetailsError',
        message: combinedResultForNumbers.errorValue()
      }
    }

    const paymentOrError = Payment.create({
      payeeId: payeeIdOrError.getValue() as PayeeId,
      payerId: payerIdOrError.getValue() as PayerId,
      paymentSystem: paymentSystemOrError.getValue() as PaymentSystem,
      paymentMethod: paymentMethodOrError.getValue() as PaymentMethod,
      amount: amountOrError.getValue() as Amount,
      currency: currencyOrError.getValue() as Currency,
      comment: commentOrError.getValue() as Comment
    });

    if (paymentOrError.isFailure) {
      return {
        type: 'InvalidPaymentDetailsError',
        message: paymentOrError.errorValue()
      }
    }

    const payment = paymentOrError.getValue() as Payment;

    // Save user to database
    try {
      await this.paymentRepo.save(payment);
    } catch (err) {

      // Log this to monitoring or logging plugin but don't return
      // the backend error to the client.

      return {
        type: 'UnexpectedError'
      }
    }

    return {
      type: 'CreatePaymentSuccess'
    }
  }
}
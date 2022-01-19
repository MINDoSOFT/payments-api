import { Result } from '../../../../shared/core/result';
import { UseCase } from '../../../../shared/core/useCase';
import { IPaymentRepo } from '../../repos/paymentRepo';
import { PaymentId } from '../../domain/paymentId';
import { Payment } from '../../domain/payment';
import { CreatePaymentObject } from '../../../../pocos/payment-object';

type GetPaymentInput = {
  paymentId: string;
}

type GetPaymentSuccess = {
  type: 'GetPaymentSuccess',
  payment: CreatePaymentObject
}

type InvalidPaymentIdError = {
  type: 'InvalidPaymentIdError';
  message: string;
}

type UnexpectedError = {
  type: 'UnexpectedError'
}

export type GetPaymentResult = GetPaymentSuccess 
  | InvalidPaymentIdError
  | UnexpectedError;

export class GetPayment implements UseCase<GetPaymentInput, GetPaymentResult> {
  private paymentRepo: IPaymentRepo;

  constructor (paymentRepo: IPaymentRepo) {
    this.paymentRepo = paymentRepo;
  }

  public async execute (input: GetPaymentInput): Promise<GetPaymentResult> {

    // Validation logic
    const paymentIdOrError = PaymentId.create(input.paymentId);

    const combinedResult = Result.combine([ 
      paymentIdOrError
    ]);

    if (combinedResult.isFailure) {
      return {
        type: 'InvalidPaymentIdError',
        message: combinedResult.errorValue()
      }
    }

    let payment : Payment;
    let paymentPOCO : CreatePaymentObject;
    // Get payment from database
    try {
        const paymentId = paymentIdOrError.getValue() as PaymentId
        payment = await this.paymentRepo.findById(paymentId.props.value) as Payment
        paymentPOCO = payment.getPOCO();
    } catch (err) {

      // Log this to monitoring or logging plugin but don't return
      // the backend error to the client.

      return {
        type: 'UnexpectedError'
      }
    }

    return {
      type: 'GetPaymentSuccess',
      payment: paymentPOCO
    }
  }
}
import { ZodError } from 'zod';
import { CreatePaymentObject, PaymentObject, PaymentStatusEnum } from '../pocos/payment-object';
import { IPaymentRepo } from '../repos/payment-repo';
import { CreatePaymentSchema } from '../schemas/payment-schema';

type GetPaymentsSuccess = {
  type: 'GetPaymentsSuccess';
  payments: PaymentObject[];
}

type UnexpectedError = {
  type: 'UnexpectedError'
}

type CreatePaymentInput = {
  payment: CreatePaymentObject;
}

type CreatePaymentSuccess = {
  type: 'CreatePaymentSuccess';
  paymentId: string;
}

export type SchemaValidationError = {
  message: string, 
  path: (string | number)[]
}

type CreatePaymentSchemaValidationError = {
  type: 'CreatePaymentSchemaValidationError';
  errors: SchemaValidationError[];
}

type GetPaymentInput = {
  paymentId: string;
}

type GetPaymentSuccess = {
  type: 'GetPaymentSuccess';
  payment: PaymentObject;
}

type PaymentNotFoundError = {
  type: 'PaymentNotFoundError';
  paymentId: string;
  message: string;
}

type ApprovePaymentInput = {
  paymentId: string;
}

type ApprovePaymentSuccess = {
  type: 'ApprovePaymentSuccess';
}

type PaymentHasBeenCancelledError = {
  type: 'PaymentHasBeenCancelledError';
  paymentId: string;
  status: string;
  message: string;
}

type PaymentAlreadyApprovedError = {
  type: 'PaymentAlreadyApprovedError';
  paymentId: string;
  message: string;
}

type CancelPaymentInput = {
  paymentId: string;
}

type CancelPaymentSuccess = {
  type: 'CancelPaymentSuccess';
}

type PaymentHasBeenApprovedError = {
  type: 'PaymentHasBeenApprovedError';
  paymentId: string;
  status: string;
  message: string;
}

type PaymentAlreadyCancelledError = {
  type: 'PaymentAlreadyCancelledError';
  paymentId: string;
  message: string;
}

export type GetPaymentsResult = GetPaymentsSuccess 
  | UnexpectedError;

export type CreatePaymentResult = CreatePaymentSuccess 
  | CreatePaymentSchemaValidationError
  | UnexpectedError;

export type GetPaymentResult = GetPaymentSuccess 
  | PaymentNotFoundError
  | UnexpectedError;

export type ApprovePaymentResult = ApprovePaymentSuccess 
  | PaymentNotFoundError
  | PaymentHasBeenCancelledError
  | PaymentAlreadyApprovedError
  | UnexpectedError;

export type CancelPaymentResult = CancelPaymentSuccess 
  | PaymentNotFoundError
  | PaymentHasBeenApprovedError
  | PaymentAlreadyCancelledError
  | UnexpectedError;

export class PaymentService {
  private paymentRepository: IPaymentRepo;

  constructor(paymentRepository : IPaymentRepo) {
    this.paymentRepository = paymentRepository;
  }

  getPayments = async (): Promise<GetPaymentsResult> => {
    try {
      const payments = await this.paymentRepository.list();

      return { type: 'GetPaymentsSuccess', payments }; 
    } catch (error) {
      return { type: 'UnexpectedError' };
    }
  };

  createPayment = async (
    input: CreatePaymentInput
  ): Promise<CreatePaymentResult> => {

    try {
      CreatePaymentSchema.parse(input.payment);

      const paymentCreated = await this.paymentRepository.create(input.payment);

      return { type: 'CreatePaymentSuccess', paymentId: paymentCreated.id }; 
    } catch (error) {
      if (error instanceof ZodError) {
        const errors : { message: string, path: (string | number)[]}[] = []

        error.issues.forEach(issue => {
          errors.push({message: issue.message, path: issue.path});
        });
        return { type: 'CreatePaymentSchemaValidationError', errors: errors };
      }
      return { type: 'UnexpectedError' };
    }
  };

  private getPaymentObject = async (paymentId: string) => {
    const resPayment = await this.paymentRepository.findById(paymentId);
    return resPayment;
  };

  getPayment = async (input: GetPaymentInput): Promise<GetPaymentResult> => {
    try {
      const payment = await this.getPaymentObject(input.paymentId);

      if (!payment) {
        const errorMessage = 'Could not find payment with id: ' + input.paymentId;
        return { type: 'PaymentNotFoundError', 
          paymentId: input.paymentId,
          message: errorMessage
        }
      }

      return { type: 'GetPaymentSuccess', payment: payment }; 
    } catch (error) {
      return { type: 'UnexpectedError' };
    }
  };

  private async setPaymentStatus(payment: PaymentObject, statusToSet: string) {
    payment.status = statusToSet;

    await this.paymentRepository.update(payment);
  }

  approvePayment = async (
    input: ApprovePaymentInput
  ): Promise<ApprovePaymentResult> => {
    try {
      const payment = await this.getPaymentObject(input.paymentId);

      if (!payment) {
        const errorMessage = 'Could not find payment with id: ' + input.paymentId;
        return { type: 'PaymentNotFoundError', 
          paymentId: input.paymentId,
          message: errorMessage
        }
      }

      if (
        payment.status.trim().toLowerCase() == PaymentStatusEnum.CANCELLED
      ) {
        const errorMessage = `Cannot approve payment (id: '${input.paymentId}') because it has status : '${payment.status}'`
        return {
          type: 'PaymentHasBeenCancelledError',
          paymentId: input.paymentId,
          status: payment.status,
          message: errorMessage
        }
      } else if (
        payment.status.trim().toLowerCase() == PaymentStatusEnum.APPROVED
      ) {
        const errorMessage = `Payment (id: '${input.paymentId}') was already approved`
        return {
          type: 'PaymentAlreadyApprovedError',
          paymentId: input.paymentId,
          message: errorMessage
        }
      }

      this.setPaymentStatus(payment, PaymentStatusEnum.APPROVED);

      return { type: 'ApprovePaymentSuccess' };
    } catch (error) {
      return { type: 'UnexpectedError' };
    }
  };

  cancelPayment = async (
    input: CancelPaymentInput
  ): Promise<CancelPaymentResult> => {
    try {
      const payment = await this.getPaymentObject(input.paymentId);

      if (!payment) {
        const errorMessage = 'Could not find payment with id: ' + input.paymentId;
        return { type: 'PaymentNotFoundError', 
          paymentId: input.paymentId,
          message: errorMessage
        }
      }

      if (
        payment.status.trim().toLowerCase() == PaymentStatusEnum.APPROVED
      ) {
        const errorMessage = `Cannot cancel payment (id: '${input.paymentId}') because it has status : '${payment.status}'`
        return {
          type: 'PaymentHasBeenApprovedError',
          paymentId: input.paymentId,
          status: payment.status,
          message: errorMessage
        }
      } else if (
        payment.status.trim().toLowerCase() == PaymentStatusEnum.CANCELLED
      ) {
        const errorMessage = `Payment (id: '${input.paymentId}') was already cancelled`
        return {
          type: 'PaymentAlreadyCancelledError',
          paymentId: input.paymentId,
          message: errorMessage
        }
      }

      this.setPaymentStatus(payment, PaymentStatusEnum.CANCELLED);

      return { type: 'CancelPaymentSuccess' };
    } catch (error) {
      return { type: 'UnexpectedError' };
    }
  };
}

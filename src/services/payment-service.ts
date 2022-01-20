import {
  PaymentAlreadyApprovedError,
  PaymentAlreadyCancelledError,
  PaymentHasBeenApprovedError,
  PaymentHasBeenCancelledError,
  PaymentNotFoundError
} from '../errors/payment-service-error';
import {
  approvePaymentInput,
  approvePaymentOutput,
  cancelPaymentInput,
  cancelPaymentOutput,
  createPaymentInput,
  createPaymentOutput,
  getPaymentInput,
  getPaymentOutput,
  getPaymentsOutput
} from '../interfaces/services/payment-service-interface';
import { PaymentObject } from '../pocos/payment-object';
import { IPaymentRepo } from '../repos/payment-repo';
import { PaymentStatusEnum } from '../schemas/payment-schema';

export class PaymentService {
  private paymentRepository: IPaymentRepo;

  constructor(paymentRepository : IPaymentRepo) {
    this.paymentRepository = paymentRepository;
  }

  getPayments = async (): Promise<getPaymentsOutput> => {

    const payments = await this.paymentRepository.list();

    return { payments };
  };

  createPayment = async (
    input: createPaymentInput
  ): Promise<createPaymentOutput> => {

    const paymentCreated = await this.paymentRepository.create(input.payment);

    return { paymentId: paymentCreated.id };
  };

  private getPaymentObject = async (paymentId: string) => {

    const resPayment = await this.paymentRepository.findById(paymentId);

    if (!resPayment) {
      throw new PaymentNotFoundError(paymentId);
    }

    return resPayment;
  };

  getPayment = async (input: getPaymentInput): Promise<getPaymentOutput> => {
    const payment = await this.getPaymentObject(input.paymentId);
    return { payment };
  };

  private async setPaymentStatus(payment: PaymentObject, statusToSet: string) {
    payment.status = statusToSet;

    await this.paymentRepository.update(payment);
  }

  approvePayment = async (
    input: approvePaymentInput
  ): Promise<approvePaymentOutput> => {
    const payment = await this.getPaymentObject(input.paymentId);

    if (
      payment.status.trim().toLowerCase() == PaymentStatusEnum.enum.cancelled
    ) {
      throw new PaymentHasBeenCancelledError(input.paymentId, payment.status);
    } else if (
      payment.status.trim().toLowerCase() == PaymentStatusEnum.enum.approved
    ) {
      throw new PaymentAlreadyApprovedError(input.paymentId);
    }

    this.setPaymentStatus(payment, PaymentStatusEnum.enum.approved);

    return { approved: true };
  };

  cancelPayment = async (
    input: cancelPaymentInput
  ): Promise<cancelPaymentOutput> => {
    const payment = await this.getPaymentObject(input.paymentId);

    if (
      payment.status.trim().toLowerCase() == PaymentStatusEnum.enum.approved
    ) {
      throw new PaymentHasBeenApprovedError(input.paymentId, payment.status);
    } else if (
      payment.status.trim().toLowerCase() == PaymentStatusEnum.enum.cancelled
    ) {
      throw new PaymentAlreadyCancelledError(input.paymentId);
    }

    this.setPaymentStatus(payment, PaymentStatusEnum.enum.cancelled);

    return { cancelled: true };
  };
}

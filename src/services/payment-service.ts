import { EntityRepository } from '@mikro-orm/core';
import { isPayment, Payment } from '../entities/Payment';
import {
  PaymentAlreadyApprovedError,
  PaymentAlreadyCancelledError,
  PaymentHasBeenApprovedError,
  PaymentHasBeenCancelledError,
  PaymentNotFoundError
} from '../errors/payment-service-error';
import { MapPaymentEntityToPaymentObject } from '../interfaces/routes/payment';
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
import { CreatePaymentObject, PaymentObject } from '../pocos/payment-object';
import { PaymentStatusEnum } from '../schemas/payment-schema';

export class PaymentService {
  private paymentRepository: EntityRepository<Payment>;

  constructor(paymentRepository: EntityRepository<Payment>) {
    this.paymentRepository = paymentRepository;
  }

  getPayments = async (): Promise<getPaymentsOutput> => {
    const payments = await this.paymentRepository.findAll();
    const paymentObjects: PaymentObject[] = [];
    payments.forEach((payment) => {
      paymentObjects.push(MapPaymentEntityToPaymentObject(payment));
    });
    return { payments: paymentObjects };
  };

  createPayment = async (
    input: createPaymentInput
  ): Promise<createPaymentOutput> => {
    const reqPayment = new Payment(input.payment);

    await this.paymentRepository.persist(reqPayment).flush();

    return { paymentId: reqPayment._id };
  };

  private getPaymentEntity = async (paymentId: string) => {
    const resPayment = await this.paymentRepository.findOne({
      _id: paymentId
    });

    if (!isPayment(resPayment)) {
      throw new PaymentNotFoundError(paymentId);
    }

    return resPayment;
  };

  getPayment = async (input: getPaymentInput): Promise<getPaymentOutput> => {
    const paymentEntity = await this.getPaymentEntity(input.paymentId);
    const paymentObject = MapPaymentEntityToPaymentObject(paymentEntity);
    return { payment: paymentObject };
  };

  private async setPaymentStatus(payment: Payment, statusToSet: string) {
    payment.status = statusToSet;

    await this.paymentRepository.persist(payment).flush();
  }

  approvePayment = async (
    input: approvePaymentInput
  ): Promise<approvePaymentOutput> => {
    const payment = await this.getPaymentEntity(input.paymentId);

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
    const payment = await this.getPaymentEntity(input.paymentId);

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

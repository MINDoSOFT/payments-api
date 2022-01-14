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
import { CreatePaymentObject, PaymentObject } from '../pocos/payment-object';
import { PaymentStatusEnum } from '../schemas/payment-schema';

export class PaymentService {
  private paymentRepository: EntityRepository<Payment>;

  constructor(paymentRepository: EntityRepository<Payment>) {
    this.paymentRepository = paymentRepository;
  }

  getPayments = async () => {
    const payments = await this.paymentRepository.findAll();
    const paymentObjects: PaymentObject[] = [];
    payments.forEach((payment) => {
      paymentObjects.push(MapPaymentEntityToPaymentObject(payment));
    });
    return paymentObjects;
  };

  createPayment = async (createPaymentObject: CreatePaymentObject) => {
    const reqPayment = new Payment(createPaymentObject);

    await this.paymentRepository.persist(reqPayment).flush();

    return reqPayment._id;
  };

  private getPaymentEntity = async (paymentId: string) => {
    const resPayment = await this.paymentRepository.findOne({
      _id: paymentId
    });

    if (!isPayment(resPayment)) {
      throw new PaymentNotFoundError(paymentId);
    }

    return resPayment;
  }

  getPayment = async (paymentId: string) => {
    const paymentEntity = await this.getPaymentEntity(paymentId);
    const paymentObject = MapPaymentEntityToPaymentObject(paymentEntity);
    return paymentObject;
  };

  private async setPaymentStatus(payment: Payment, statusToSet: string) {
    payment.status = statusToSet;

    await this.paymentRepository.persist(payment).flush();
  }

  approvePayment = async (paymentId: string) => {
    const payment = await this.getPaymentEntity(paymentId);

    if (
      payment.status.trim().toLowerCase() == PaymentStatusEnum.enum.cancelled
    ) {
      throw new PaymentHasBeenCancelledError(paymentId, payment.status);
    } else if (
      payment.status.trim().toLowerCase() == PaymentStatusEnum.enum.approved
    ) {
      throw new PaymentAlreadyApprovedError(paymentId);
    }

    this.setPaymentStatus(payment, PaymentStatusEnum.enum.approved);

    return true;
  };

  cancelPayment = async (paymentId: string) => {
    const payment = await this.getPaymentEntity(paymentId);

    if (
      payment.status.trim().toLowerCase() == PaymentStatusEnum.enum.approved
    ) {
      throw new PaymentHasBeenApprovedError(paymentId, payment.status);
    } else if (
      payment.status.trim().toLowerCase() == PaymentStatusEnum.enum.cancelled
    ) {
      throw new PaymentAlreadyCancelledError(paymentId);
    }

    this.setPaymentStatus(payment, PaymentStatusEnum.enum.cancelled);

    return true;
  };
}

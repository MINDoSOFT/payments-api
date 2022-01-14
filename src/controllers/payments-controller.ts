import { EntityRepository } from '@mikro-orm/core';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { isPayment, Payment } from '../entities/Payment';
import {
  ERROR_ALREADY_APPROVED_CODE,
  ERROR_ALREADY_APPROVED_MESSAGE,
  ERROR_ALREADY_CANCELLED_CODE,
  ERROR_ALREADY_CANCELLED_MESSAGE,
  ERROR_CANNOT_APPROVE_CODE,
  ERROR_CANNOT_APPROVE_MESSAGE,
  ERROR_CANNOT_CANCEL_CODE,
  ERROR_CANNOT_CANCEL_MESSAGE,
  ERROR_VALIDATION_CODE,
  ERROR_VALIDATION_MESSAGE
} from '../enums/api-error-codes';
import { ErrorDetail, ErrorResponse } from '../interfaces/routes/error';
import {
  ApprovePaymentRequest,
  ApprovePaymentResponse,
  CancelPaymentRequest,
  CancelPaymentResponse,
  CreatePaymentRequest,
  CreatePaymentResponse,
  GetPaymentRequest,
  GetPaymentResponse,
  ListPaymentsRequest,
  ListPaymentsResponse,
  MapPaymentEntityToPaymentObject
} from '../interfaces/routes/payment';
import { PaymentObject } from '../pocos/payment-object';
import {
  ApprovePaymentSchema,
  CancelPaymentSchema,
  GetPaymentSchema
} from '../schemas/payment-schema';

export class PaymentsController {
  private paymentRepository: EntityRepository<Payment>;

  constructor(paymentRepository: EntityRepository<Payment>) {
    this.paymentRepository = paymentRepository;
  }

  getPayments = async (
    _req: ListPaymentsRequest,
    res: ListPaymentsResponse
  ) => {
    try {
      const payments = await this.paymentRepository.findAll();
      const paymentObjects: PaymentObject[] = [];
      payments.forEach((payment) => {
        paymentObjects.push(MapPaymentEntityToPaymentObject(payment));
      });

      return res.status(StatusCodes.OK).json(paymentObjects);
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(`Error loading payments:` + error);
    }
  };

  createPayment = async (
    req: CreatePaymentRequest,
    res: CreatePaymentResponse & ErrorResponse
  ) => {
    let reqPaymentId: string;

    try {
      const reqPayment = new Payment(req.body);
      reqPaymentId = reqPayment._id;

      await this.paymentRepository.persist(reqPayment).flush();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ErrorDetail[] = [];
        error.issues.forEach((issue) => {
          details.push(new ErrorDetail(issue.message, issue.path));
        });

        return res.status(StatusCodes.BAD_REQUEST).json({
          code: ERROR_VALIDATION_CODE,
          message: ERROR_VALIDATION_MESSAGE,
          details: details
        });
      } else {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(`Error persisting payment:` + error);
      }
    }

    try {
      const resPayment = await this.paymentRepository.findOne({
        _id: reqPaymentId
      });

      if (isPayment(resPayment)) {
        const paymentObject = MapPaymentEntityToPaymentObject(resPayment);
        return res.status(StatusCodes.CREATED).json(paymentObject);
      } else {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send('Something went wrong.');
      }
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(`Error retrieving created payment:` + error);
    }
  };

  getPayment = async (
    req: GetPaymentRequest,
    res: GetPaymentResponse & ErrorResponse
  ) => {
    try {
      GetPaymentSchema.parse(req.params);
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ErrorDetail[] = [];
        error.issues.forEach((issue) => {
          details.push(new ErrorDetail(issue.message, issue.path));
        });

        return res.status(StatusCodes.BAD_REQUEST).json({
          code: ERROR_VALIDATION_CODE,
          message: ERROR_VALIDATION_MESSAGE,
          details: details
        });
      } else {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(`Error parsing get payment request parameters:` + error);
      }
    }

    const paymentId = req.params.id;

    try {
      const resPayment = await this.paymentRepository.findOne({
        _id: paymentId
      });

      if (isPayment(resPayment)) {
        const paymentObject = MapPaymentEntityToPaymentObject(resPayment);
        return res.status(StatusCodes.OK).json(paymentObject);
      }
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(`Error loading payment '${paymentId}':` + error);
    }

    return res
      .status(StatusCodes.NOT_FOUND)
      .send(`Payment '${paymentId}' not found.`);
  };

  approvePayment = async (
    req: ApprovePaymentRequest,
    res: ApprovePaymentResponse & ErrorResponse
  ) => {
    try {
      ApprovePaymentSchema.parse(req.params);
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ErrorDetail[] = [];
        error.issues.forEach((issue) => {
          details.push(new ErrorDetail(issue.message, issue.path));
        });

        return res.status(StatusCodes.BAD_REQUEST).json({
          code: ERROR_VALIDATION_CODE,
          message: ERROR_VALIDATION_MESSAGE,
          details: details
        });
      } else {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(`Error parsing approve payment request parameters:` + error);
      }
    }

    const paymentId = req.params.id;

    try {
      const payment = await this.paymentRepository.findOne({ _id: paymentId });

      if (isPayment(payment)) {
        if (payment.status.trim().toLowerCase() == 'cancelled') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            code: ERROR_CANNOT_APPROVE_CODE,
            message: ERROR_CANNOT_APPROVE_MESSAGE
          });
        } else if (payment.status.trim().toLowerCase() == 'approved') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            code: ERROR_ALREADY_APPROVED_CODE,
            message: ERROR_ALREADY_APPROVED_MESSAGE
          });
        }

        payment.status = 'approved';

        await this.paymentRepository.persist(payment).flush();
        return res.status(StatusCodes.OK).send();
      }
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(`Error loading payment '${paymentId}':` + error);
    }

    return res
      .status(StatusCodes.NOT_FOUND)
      .send(`Payment '${paymentId}' not found.`);
  };

  cancelPayment = async (
    req: CancelPaymentRequest,
    res: CancelPaymentResponse & ErrorResponse
  ) => {
    try {
      CancelPaymentSchema.parse(req.params);
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ErrorDetail[] = [];
        error.issues.forEach((issue) => {
          details.push(new ErrorDetail(issue.message, issue.path));
        });

        return res.status(StatusCodes.BAD_REQUEST).json({
          code: ERROR_VALIDATION_CODE,
          message: ERROR_VALIDATION_MESSAGE,
          details: details
        });
      } else {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(`Error parsing cancel payment request parameters:` + error);
      }
    }

    const paymentId = req.params.id;

    try {
      const payment = await this.paymentRepository.findOne({ _id: paymentId });

      if (isPayment(payment)) {
        if (payment.status.trim().toLowerCase() == 'approved') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            code: ERROR_CANNOT_CANCEL_CODE,
            message: ERROR_CANNOT_CANCEL_MESSAGE
          });
        } else if (payment.status.trim().toLowerCase() == 'cancelled') {
          return res.status(StatusCodes.BAD_REQUEST).json({
            code: ERROR_ALREADY_CANCELLED_CODE,
            message: ERROR_ALREADY_CANCELLED_MESSAGE
          });
        }

        payment.status = 'cancelled';

        await this.paymentRepository.persist(payment).flush();
        return res.status(StatusCodes.OK).send();
      }
    } catch (error) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(`Error loading payment '${paymentId}':` + error);
    }

    return res
      .status(StatusCodes.NOT_FOUND)
      .send(`Payment '${paymentId}' not found.`);
  };
}

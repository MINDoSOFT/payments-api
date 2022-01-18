import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import {
  ERROR_ALREADY_APPROVED_CODE,
  ERROR_ALREADY_APPROVED_MESSAGE,
  ERROR_ALREADY_CANCELLED_CODE,
  ERROR_ALREADY_CANCELLED_MESSAGE,
  ERROR_CANNOT_APPROVE_CODE,
  ERROR_CANNOT_APPROVE_MESSAGE,
  ERROR_CANNOT_CANCEL_CODE,
  ERROR_CANNOT_CANCEL_MESSAGE,
  ERROR_NOT_FOUND_CODE,
  ERROR_NOT_FOUND_MESSAGE,
  ERROR_VALIDATION_CODE,
  ERROR_VALIDATION_MESSAGE
} from '../enums/api-error-codes';
import {
  PaymentAlreadyApprovedError,
  PaymentAlreadyCancelledError,
  PaymentHasBeenApprovedError,
  PaymentHasBeenCancelledError,
  PaymentNotFoundError
} from '../errors/payment-service-error';
import { ErrorResponse } from '../interfaces/routes/error';
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
  ListPaymentsResponse
} from '../interfaces/routes/payment';
import { ErrorDetail } from '../pocos/error-response-object';
import {
  ApprovePaymentSchema,
  CancelPaymentSchema,
  GetPaymentSchema
} from '../schemas/payment-schema';
import { PaymentService } from '../services/payment-service';

export class PaymentsController {
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  getPayments = async (
    _req: ListPaymentsRequest,
    res: ListPaymentsResponse
  ) => {
    try {
      const getPaymentsOutput = await this.paymentService.getPayments();
      const payments = getPaymentsOutput.payments;

      return res.status(StatusCodes.OK).json(payments);
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
      const createPaymentOutput = await this.paymentService.createPayment({
        payment: req.body
      });
      reqPaymentId = createPaymentOutput.paymentId;
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
      const getPaymentOutput = await this.paymentService.getPayment({
        paymentId: reqPaymentId
      });
      const resPayment = getPaymentOutput.payment;

      return res.status(StatusCodes.CREATED).json(resPayment);
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
      const getPaymentOutput = await this.paymentService.getPayment({
        paymentId
      });
      const resPayment = getPaymentOutput.payment;
      return res.status(StatusCodes.OK).json(resPayment);
    } catch (error) {
      if (error instanceof PaymentNotFoundError) {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: ERROR_NOT_FOUND_CODE,
          message: ERROR_NOT_FOUND_MESSAGE,
          details: []
        });
      }
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send(`Error loading payment '${paymentId}':` + error);
    }
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
      await this.paymentService.approvePayment({ paymentId });

      return res.status(StatusCodes.OK).send();
    } catch (error) {
      if (error instanceof PaymentHasBeenCancelledError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: ERROR_CANNOT_APPROVE_CODE,
          message: ERROR_CANNOT_APPROVE_MESSAGE,
          details: []
        });
      } else if (error instanceof PaymentAlreadyApprovedError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: ERROR_ALREADY_APPROVED_CODE,
          message: ERROR_ALREADY_APPROVED_MESSAGE,
          details: []
        });
      } else if (error instanceof PaymentNotFoundError) {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: ERROR_NOT_FOUND_CODE,
          message: ERROR_NOT_FOUND_MESSAGE,
          details: []
        });
      } else {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(`Error approving payment '${paymentId}':` + error);
      }
    }
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
      await this.paymentService.cancelPayment({ paymentId });

      return res.status(StatusCodes.OK).send();
    } catch (error) {
      if (error instanceof PaymentHasBeenApprovedError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: ERROR_CANNOT_CANCEL_CODE,
          message: ERROR_CANNOT_CANCEL_MESSAGE,
          details: []
        });
      } else if (error instanceof PaymentAlreadyCancelledError) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          code: ERROR_ALREADY_CANCELLED_CODE,
          message: ERROR_ALREADY_CANCELLED_MESSAGE,
          details: []
        });
      } else if (error instanceof PaymentNotFoundError) {
        return res.status(StatusCodes.NOT_FOUND).json({
          code: ERROR_NOT_FOUND_CODE,
          message: ERROR_NOT_FOUND_MESSAGE,
          details: []
        });
      } else {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send(`Error cancelling payment '${paymentId}':` + error);
      }
    }
  };
}

import { MyError } from './my-error';

export class PaymentNotFoundError extends MyError {
  paymentId: string;
  constructor(paymentId: string) {
    super('Could not find payment with id: ' + paymentId);
    this.paymentId = paymentId;
  }
}

export class PaymentHasBeenCancelledError extends MyError {
  paymentId: string;
  status: string;

  constructor(paymentId: string, status: string) {
    super(
      `Cannot approve payment (id: '${paymentId}') because it has status : '${status}'`
    );
    this.paymentId = paymentId;
    this.status = status;
  }
}

export class PaymentAlreadyApprovedError extends MyError {
  paymentId: string;
  constructor(paymentId: string) {
    super(`Payment (id: '${paymentId}') was already approved`);
    this.paymentId = paymentId;
  }
}

export class PaymentHasBeenApprovedError extends MyError {
  paymentId: string;
  status: string;

  constructor(paymentId: string, status: string) {
    super(
      `Cannot cancel payment (id: '${paymentId}') because it has status : '${status}'`
    );
    this.paymentId = paymentId;
    this.status = status;
  }
}

export class PaymentAlreadyCancelledError extends MyError {
  paymentId: string;
  constructor(paymentId: string) {
    super(`Payment (id: '${paymentId}') was already cancelled`);
    this.paymentId = paymentId;
  }
}

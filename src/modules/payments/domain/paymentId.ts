
import { Result } from "../../../shared/core/result"
import { ValueObject } from "../../../shared/domain/valueObject"
import { validate as uuidValidate } from 'uuid';

interface PaymentIdProps {
  value: string;
}

export class PaymentId extends ValueObject<PaymentIdProps> {

  private constructor (props: PaymentIdProps) {
    super(props);
  }

  public static isValidPaymentId (paymentId: string) {
    return uuidValidate(paymentId);
  }

  public static create (paymentId: string): Result<PaymentId> {
    if (!this.isValidPaymentId(paymentId)) {
      return Result.fail<PaymentId>('Invalid PaymentId')
    }

    return Result.ok<PaymentId>(new PaymentId({ value: paymentId }))
  }

}
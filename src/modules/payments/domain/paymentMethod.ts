
import { Result } from "../../../shared/core/result"
import { ValueObject } from "../../../shared/domain/valueObject"

interface PaymentMethodProps {
  value: string;
}

export class PaymentMethod extends ValueObject<PaymentMethodProps> {

  private constructor (props: PaymentMethodProps) {
    super(props);
  }

  public static isValidPaymentMethod (paymentMethod: string) {
    return paymentMethod.length >= 2;
  }

  public static create (paymentMethod: string): Result<PaymentMethod> {
    if (!this.isValidPaymentMethod(paymentMethod)) {
      return Result.fail<PaymentMethod>('Invalid PaymentMethod')
    }

    return Result.ok<PaymentMethod>(new PaymentMethod({ value: paymentMethod }))
  }

}
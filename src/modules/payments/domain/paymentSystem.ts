
import { Result } from "../../../shared/core/result"
import { ValueObject } from "../../../shared/domain/valueObject"

interface PaymentSystemProps {
  value: string;
}

export class PaymentSystem extends ValueObject<PaymentSystemProps> {

  private constructor (props: PaymentSystemProps) {
    super(props);
  }

  public static isValidPaymentSystem (paymentSystem: string) {
    return paymentSystem.length >= 2;
  }

  public static create (paymentSystem: string): Result<PaymentSystem> {
    if (!this.isValidPaymentSystem(paymentSystem)) {
      return Result.fail<PaymentSystem>('Invalid PaymentSystem')
    }

    return Result.ok<PaymentSystem>(new PaymentSystem({ value: paymentSystem }))
  }

}
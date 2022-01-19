
import { Result } from "../../../shared/core/result"
import { ValueObject } from "../../../shared/domain/valueObject"
import { validate as uuidValidate } from 'uuid';

interface PayerIdProps {
  value: string;
}

export class PayerId extends ValueObject<PayerIdProps> {

  private constructor (props: PayerIdProps) {
    super(props);
  }

  public static isValidPayerId (payerId: string) {
    return uuidValidate(payerId);
  }

  public static create (payerId: string): Result<PayerId> {
    if (!this.isValidPayerId(payerId)) {
      return Result.fail<PayerId>('Invalid PayerId')
    }

    return Result.ok<PayerId>(new PayerId({ value: payerId }))
  }

}
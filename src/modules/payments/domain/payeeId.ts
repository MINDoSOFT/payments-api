
import { Result } from "../../../shared/core/result"
import { ValueObject } from "../../../shared/domain/valueObject"
import { validate as uuidValidate } from 'uuid';

interface PayeeIdProps {
  value: string;
}

export class PayeeId extends ValueObject<PayeeIdProps> {

  private constructor (props: PayeeIdProps) {
    super(props);
  }

  public static isValidPayeeId (payeeId: string) {
    return uuidValidate(payeeId);
  }

  public static create (payeeId: string): Result<PayeeId> {
    if (!this.isValidPayeeId(payeeId)) {
      return Result.fail<PayeeId>('Invalid PayeeId')
    }

    return Result.ok<PayeeId>(new PayeeId({ value: payeeId }))
  }

}
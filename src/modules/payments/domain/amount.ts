
import { Result } from "../../../shared/core/result"
import { ValueObject } from "../../../shared/domain/valueObject"

interface AmountProps {
  value: number;
}

export class Amount extends ValueObject<AmountProps> {

  private constructor (props: AmountProps) {
    super(props);
  }

  public static isValidAmount (amount: number) {
    return amount !== 0;
  }

  public static create (amount: number): Result<Amount> {
    if (!this.isValidAmount(amount)) {
      return Result.fail<Amount>('Invalid Amount')
    }

    return Result.ok<Amount>(new Amount({ value: amount }))
  }

}
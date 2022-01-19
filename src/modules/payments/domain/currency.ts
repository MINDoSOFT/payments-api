
import { Result } from "../../../shared/core/result"
import { ValueObject } from "../../../shared/domain/valueObject"

interface CurrencyProps {
  value: string;
}

export class Currency extends ValueObject<CurrencyProps> {

  private constructor (props: CurrencyProps) {
    super(props);
  }

  public static isValidCurrency (currency: string) {
    return currency.length >= 2;
  }

  public static create (currency: string): Result<Currency> {
    if (!this.isValidCurrency(currency)) {
      return Result.fail<Currency>('Invalid Currency')
    }

    return Result.ok<Currency>(new Currency({ value: currency }))
  }

}
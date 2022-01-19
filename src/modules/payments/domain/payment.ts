import { Guard } from "../../../shared/core/guard";
import { Result } from "../../../shared/core/result";
import { Entity } from "../../../shared/domain/entity";
import { PayerId } from "./payerId";
import { PayeeId } from "./payeeId";
import { Amount } from "./amount";
import { PaymentMethod } from "./paymentMethod";
import { PaymentSystem } from "./paymentSystem";
import { Currency } from "./currency";
import { Comment } from "./comment";
import { CreatePaymentObject, PaymentObject } from "../../../pocos/payment-object";

interface PaymentProps {
  payerId: PayerId;
  payeeId: PayeeId; 
  amount: Amount;
  paymentMethod: PaymentMethod;
  paymentSystem: PaymentSystem;
  currency: Currency;
  comment: Comment;
}

export class Payment extends Entity<PaymentProps> {

  getPayerId (): PayerId {
    return this.props.payerId;
  }

  getPayeeId (): PayeeId {
    return this.props.payeeId;
  }

  getAmount (): Amount {
    return this.props.amount;
  }

  getPaymentMethod (): PaymentMethod {
    return this.props.paymentMethod;
  }

  getPaymentSystem (): PaymentSystem {
    return this.props.paymentSystem;
  }

  getCurrency (): Currency {
    return this.props.currency;
  }
  
  getComment (): Comment {
    return this.props.comment;
  }

  getPOCO () : CreatePaymentObject {
    const poco =  {
      payeeId : this.getPayeeId().props.value,
      payerId : this.getPayerId().props.value,
      paymentSystem : this.getPaymentSystem().props.value,
      paymentMethod : this.getPaymentMethod().props.value,
      amount : this.getAmount().props.value,
      currency : this.getCurrency().props.value,
      comment : this.getComment().props.value
    };

    return poco;
  }

  private constructor (props: PaymentProps) {
    super(props);
  }

  public static create (paymentProps: PaymentProps): Result<Payment> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: paymentProps.payerId, argumentName: 'payerId' },
      { argument: paymentProps.payeeId, argumentName: 'payeeId' },
      { argument: paymentProps.amount, argumentName: 'amount' },
      { argument: paymentProps.paymentMethod, argumentName: 'paymentMethod' },
      { argument: paymentProps.paymentSystem, argumentName: 'paymentSystem' },
      { argument: paymentProps.currency, argumentName: 'currency' },
      { argument: paymentProps.comment, argumentName: 'comment' },
    ]);
    
    if (!guardResult.succeeded) {
      return Result.fail<Payment>(guardResult.message as string)
    }

    return Result.ok<Payment>(new Payment(paymentProps));
  }

}
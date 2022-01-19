
import * as express from 'express'
import { CreatePayment } from './createPayment';

export class CreatePaymentController {

  private useCase: CreatePayment;

  constructor (useCase: CreatePayment) {
    this.useCase = useCase;
  }

  public async execute (req: express.Request, res: express.Response) {
    const body = req.body;

    // Check to see if required parameters are in the request
    const isPayeeIdPresent = body.payeeId
    const isPayerIdPresent = body.payerId;
    const isPaymentSystemPresent = body.paymentSystem;
    const isPaymentMethodPresent = body.paymentMethod;
    const isAmountPresent = body.amount;
    const isCurrencyPresent = body.currency;
    const isCommentPresent = body.comment;

    // If not, end the request
    if (!isPayeeIdPresent || !isPayerIdPresent || !isPaymentSystemPresent || !isPaymentMethodPresent ||
        !isAmountPresent || !isCurrencyPresent || !isCommentPresent) {
      return res.status(400).json({ 
        message: `Either 'payeeId', 'payerId', 'paymentSystem', 'paymentMethod', 'amount', 'currency' or 'comment' not present`
      })
    }

    const payeeId: string = body.payeeId;
    const payerId: string = body.payerId;
    const paymentSystem: string = body.paymentSystem;
    const paymentMethod: string = body.paymentMethod;
    const amount: number = body.amount;
    const currency: string = body.currency;
    const comment: string = body.comment;

    try {
      const result = await this.useCase.execute({
        payeeId, payerId, paymentSystem, paymentMethod, amount, currency, comment
      });

      switch (result.type) {
        case 'CreatePaymentSuccess':
          return res.status(201).json(result) 
        case 'InvalidPaymentDetailsError':
          return res.status(400).json(result) 
        case 'UnexpectedError':
          return res.status(500).json(result) 
      }
    } catch (err) {
      // Report the error to metrics + logging app
      
      return res.status(500);
    }
  }
}
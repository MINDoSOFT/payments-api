
import * as express from 'express'
import { GetPayment } from './getPayment';

export class GetPaymentController {

  private useCase: GetPayment;

  constructor (useCase: GetPayment) {
    this.useCase = useCase;
  }

  public async execute (req: express.Request, res: express.Response) {
    const body = req.body;

    // Check to see if required parameters are in the request
    const isPaymentIdPresent = req.params.id;

    // If not, end the request
    if (!isPaymentIdPresent) {
      return res.status(400).json({ 
        message: `'paymentId' not present`
      })
    }

    const paymentId: string = req.params.id;

    try {
      const result = await this.useCase.execute({
        paymentId
      });

      switch (result.type) {
        case 'GetPaymentSuccess':
          return res.status(201).json(result) 
        case 'InvalidPaymentIdError':
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
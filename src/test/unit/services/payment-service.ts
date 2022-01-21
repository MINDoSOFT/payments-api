import { stubInterface } from "ts-sinon";
import { IPaymentRepo } from "../../../repos/payment-repo";

import { PaymentService } from "../../../services/payment-service";
import { assert } from 'chai';
import { getTestPayment } from "./payment-helper";

describe('Payment Service', () => {
    it('should return the payment', async () => {
        const getTestPaymentOutput = getTestPayment();
        const testPayment = getTestPaymentOutput.payment;

        const paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(testPayment)
        });

        const paymentService = new PaymentService(paymentRepo);

        const getPaymentResult = await paymentService.getPayment({ paymentId : testPayment.id });

        if (getPaymentResult.type !== 'GetPaymentSuccess') {
            assert.fail();
        } else {
            const payment = getPaymentResult.payment;
            assert.equal(testPayment.id, payment.id);
            assert.equal(testPayment.payeeId, payment.payeeId);
            assert.equal(testPayment.payerId, payment.payerId);
            assert.equal(testPayment.paymentSystem, payment.paymentSystem);
            assert.equal(testPayment.paymentMethod, payment.paymentMethod);
            assert.equal(testPayment.amount, payment.amount);
            assert.equal(testPayment.currency, payment.currency);
            assert.equal(testPayment.status, payment.status);
            assert.equal(testPayment.comment, payment.comment);
            assert.equal(testPayment.created, payment.created);
            assert.equal(testPayment.updated, payment.updated);
        }
    });

});
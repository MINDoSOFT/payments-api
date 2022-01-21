import { stubInterface } from "ts-sinon";
import { IPaymentRepo } from "../../../repos/payment-repo";

import { PaymentService } from "../../../services/payment-service";
import chai from "chai";
import chaiUuid = require('chai-uuid');
chai.use(chaiUuid);
import { getTestPayment } from "./payment-helper";
import { CreatePaymentObject, PaymentObject, PaymentStatusEnum } from "../../../pocos/payment-object";
import { assertPayment } from "../../integration/payment-helper";

const assert = chai.assert;

describe('Payment Service', () => {
    let paymentRepo : IPaymentRepo;
    let testPayment : PaymentObject

    it('should return the payment', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(testPayment)
        });

        const paymentService = new PaymentService(paymentRepo);

        const getPaymentResult = await paymentService.getPayment({ paymentId : testPayment.id });

        if (getPaymentResult.type !== 'GetPaymentSuccess') {
            assert.fail();
        } else {
            const payment = getPaymentResult.payment;
            assertPayment(payment, testPayment);
        }
    });

    it('should return payment not found', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(undefined)
        });

        const paymentService = new PaymentService(paymentRepo);
        const aMissingPaymentId = '3b394bd4-b037-4e69-92d5-863306a62214';

        const getPaymentResult = await paymentService.getPayment({ paymentId : aMissingPaymentId });

        if (getPaymentResult.type !== 'PaymentNotFoundError') {
            assert.fail();
        }
    });

    it('should return created payment success with created payment id', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        paymentRepo = stubInterface<IPaymentRepo>({
            create: Promise.resolve(testPayment)
        });

        const paymentService = new PaymentService(paymentRepo);

        const createPaymentInput : CreatePaymentObject = {
            ...testPayment
        }

        const createPaymentResult = await paymentService.createPayment({payment : createPaymentInput});

        if (createPaymentResult.type !== 'CreatePaymentSuccess') {
            assert.fail();
        } else {
            assert.uuid(createPaymentResult.paymentId);
            assert.equal(createPaymentResult.paymentId, testPayment.id);
        }
    });

    it('should return created payment wrong payeeId schema validation error', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        testPayment.payeeId = '1234';

        paymentRepo = stubInterface<IPaymentRepo>({
            create: Promise.resolve(testPayment)
        });

        const paymentService = new PaymentService(paymentRepo);

        const createPaymentInput : CreatePaymentObject = {
            ...testPayment
        }

        const createPaymentResult = await paymentService.createPayment({payment : createPaymentInput});

        if (createPaymentResult.type !== 'CreatePaymentSchemaValidationError') {
            assert.fail();
        } else {
            assert.isArray(createPaymentResult.errors);
            assert.equal(createPaymentResult.errors.length, 1);
        }
    });

    it('should return created payment wrong payeeId and wrong payerId schema validation error', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        testPayment.payeeId = '1234';
        testPayment.payerId = 'ABCD'

        paymentRepo = stubInterface<IPaymentRepo>({
            create: Promise.resolve(testPayment)
        });

        const paymentService = new PaymentService(paymentRepo);

        const createPaymentInput : CreatePaymentObject = {
            ...testPayment
        }

        const createPaymentResult = await paymentService.createPayment({payment : createPaymentInput});

        if (createPaymentResult.type !== 'CreatePaymentSchemaValidationError') {
            assert.fail();
        } else {
            assert.isArray(createPaymentResult.errors);
            assert.equal(createPaymentResult.errors.length, 2);
        }
    });

    it('should return the payments (no payments added)', async () => {
        paymentRepo = stubInterface<IPaymentRepo>({
            list: Promise.resolve([])
        });

        const paymentService = new PaymentService(paymentRepo);

        const getPaymentsResult = await paymentService.getPayments();

        if (getPaymentsResult.type !== 'GetPaymentsSuccess') {
            assert.fail();
        } else {
            assert.isArray(getPaymentsResult.payments);
            assert.equal(getPaymentsResult.payments.length, 0);
        }
    });

    it('should return the payments exactly one payment', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        paymentRepo = stubInterface<IPaymentRepo>({
            list: Promise.resolve([testPayment])
        });

        const paymentService = new PaymentService(paymentRepo);

        const getPaymentsResult = await paymentService.getPayments();

        if (getPaymentsResult.type !== 'GetPaymentsSuccess') {
            assert.fail();
        } else {
            assert.isArray(getPaymentsResult.payments);
            assert.equal(getPaymentsResult.payments.length, 1);

            const payment = getPaymentsResult.payments[0];
            assertPayment(payment, testPayment);
        }
    });

    it('should return the payments exactly two payments', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        paymentRepo = stubInterface<IPaymentRepo>({
            list: Promise.resolve([testPayment, testPayment])
        });

        const paymentService = new PaymentService(paymentRepo);

        const getPaymentsResult = await paymentService.getPayments();

        if (getPaymentsResult.type !== 'GetPaymentsSuccess') {
            assert.fail();
        } else {
            assert.isArray(getPaymentsResult.payments);
            assert.equal(getPaymentsResult.payments.length, 2);

            const payment = getPaymentsResult.payments[0];
            assertPayment(payment, testPayment);
        }
    });

    it('should return payment has been cancelled error', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        testPayment.status = PaymentStatusEnum.CANCELLED;

        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(testPayment)
        });

        const paymentService = new PaymentService(paymentRepo);

        const approvePaymentResult = await paymentService.approvePayment({ paymentId : testPayment.id });

        if (approvePaymentResult.type !== 'PaymentHasBeenCancelledError') {
            assert.fail();
        } else {
            assert.equal(approvePaymentResult.status, PaymentStatusEnum.CANCELLED);
        }
    });

    it('should return payment already approved error', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        testPayment.status = PaymentStatusEnum.APPROVED;

        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(testPayment)
        });

        const paymentService = new PaymentService(paymentRepo);

        const approvePaymentResult = await paymentService.approvePayment({ paymentId : testPayment.id });

        if (approvePaymentResult.type !== 'PaymentAlreadyApprovedError') {
            assert.fail();
        } else {
            assert.equal(approvePaymentResult.paymentId, testPayment.id);
        }
    });

    it('should return payment not found error', async () => {
        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(undefined)
        });

        const paymentService = new PaymentService(paymentRepo);

        const approvePaymentResult = await paymentService.approvePayment({ paymentId : testPayment.id });

        if (approvePaymentResult.type !== 'PaymentNotFoundError') {
            assert.fail();
        }
    });

    it('should return payment approved success', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(testPayment),
            update: Promise.resolve(true)
        });

        const paymentService = new PaymentService(paymentRepo);

        const approvePaymentResult = await paymentService.approvePayment({ paymentId : testPayment.id });

        if (approvePaymentResult.type !== 'ApprovePaymentSuccess') {
            assert.fail();
        }
    });

    it('should return payment has been approved error', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        testPayment.status = PaymentStatusEnum.APPROVED;

        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(testPayment)
        });

        const paymentService = new PaymentService(paymentRepo);

        const cancelPaymentResult = await paymentService.cancelPayment({ paymentId : testPayment.id });

        if (cancelPaymentResult.type !== 'PaymentHasBeenApprovedError') {
            assert.fail();
        } else {
            assert.equal(cancelPaymentResult.status, PaymentStatusEnum.APPROVED);
        }
    });

    it('should return payment already cancelled error', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        testPayment.status = PaymentStatusEnum.CANCELLED;

        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(testPayment)
        });

        const paymentService = new PaymentService(paymentRepo);

        const cancelPaymentResult = await paymentService.cancelPayment({ paymentId : testPayment.id });

        if (cancelPaymentResult.type !== 'PaymentAlreadyCancelledError') {
            assert.fail();
        } else {
            assert.equal(cancelPaymentResult.paymentId, testPayment.id);
        }
    });

    it('should return payment not found error', async () => {
        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(undefined)
        });

        const paymentService = new PaymentService(paymentRepo);

        const approvePaymentResult = await paymentService.cancelPayment({ paymentId : testPayment.id });

        if (approvePaymentResult.type !== 'PaymentNotFoundError') {
            assert.fail();
        }
    });

    it('should return payment cancelled success', async () => {
        const getTestPaymentOutput = getTestPayment();
        testPayment = getTestPaymentOutput.payment;

        paymentRepo = stubInterface<IPaymentRepo>({
            findById: Promise.resolve(testPayment),
            update: Promise.resolve(true)
        });

        const paymentService = new PaymentService(paymentRepo);

        const cancelPaymentResult = await paymentService.cancelPayment({ paymentId : testPayment.id });

        if (cancelPaymentResult.type !== 'CancelPaymentSuccess') {
            assert.fail();
        }
    });

});
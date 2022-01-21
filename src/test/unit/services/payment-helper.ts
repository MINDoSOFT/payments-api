import chai from "chai";

import { PaymentObject, PaymentStatusEnum } from "../../../pocos/payment-object";

const assert = chai.assert;

export function getTestPayment() : {payment: PaymentObject} {
    const testPayment : PaymentObject = {
		id: "2cb2e5bc-d499-484a-a779-367f54d2154e",
		payeeId: "25b79ada-cad6-4d40-b2f2-64bcb278aa95",
		payerId: "082de763-3f1d-432d-8020-df508996e851",
		paymentSystem: "ingenico",
		paymentMethod: "mastercard",
		amount: 100500.42,
		currency: "USD",
		status: PaymentStatusEnum.CREATED,
		comment: "Salary for March",
		created: new Date(),
		updated: new Date()
	};
    return { payment: testPayment };
}

export function assertPayment(actual : PaymentObject, expected : PaymentObject) {
    assert.equal(actual.id, expected.id);
    assert.equal(actual.payeeId, expected.payeeId);
    assert.equal(actual.payerId, expected.payerId);
    assert.equal(actual.paymentSystem, expected.paymentSystem);
    assert.equal(actual.paymentMethod, expected.paymentMethod);
    assert.equal(actual.amount, expected.amount);
    assert.equal(actual.currency, expected.currency);
    assert.equal(actual.status, expected.status);
    assert.equal(actual.comment, expected.comment);
    assert.equal(actual.created, expected.created);
    assert.equal(actual.updated, expected.updated);
}
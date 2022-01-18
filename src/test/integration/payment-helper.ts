import chai from "chai";
import { ERROR_VALIDATION_CODE, ERROR_VALIDATION_MESSAGE } from "../../enums/api-error-codes";
import { ErrorResponseObject } from "../../pocos/error-response-object";
chai.use(require('chai-uuid'));
import { CreatePaymentObject, PaymentObject } from '../../pocos/payment-object';

const assert = chai.assert;

export function assertCreatedPayment(paymentToCreate : CreatePaymentObject, createdPayment : PaymentObject) {
    assert.equal(createdPayment.payeeId, paymentToCreate.payeeId);
    assert.equal(createdPayment.payerId, paymentToCreate.payerId);
    assert.equal(createdPayment.paymentMethod, paymentToCreate.paymentMethod);
    assert.equal(createdPayment.paymentSystem, paymentToCreate.paymentSystem);
    assert.equal(createdPayment.amount, paymentToCreate.amount);
    assert.equal(createdPayment.currency, paymentToCreate.currency);
    assert.equal(createdPayment.comment, paymentToCreate.comment);

    assert.isNotEmpty(createdPayment.id);
    assert.isNotEmpty(createdPayment.created);
    assert.isNotEmpty(createdPayment.updated);

    assert.uuid(createdPayment.id);
}

export function assertMissingPaymentPropertyError(propertyName : string, validationMessage: string, errorResponse : ErrorResponseObject) {
    assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
    assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);

    assert.isArray(errorResponse.details);
    assert.lengthOf(errorResponse.details, 1);
    assert.equal(errorResponse.details[0].message, validationMessage);
    assert.isArray(errorResponse.details[0].path);
    if (errorResponse.details[0].path !== undefined) {
        assert.include(errorResponse.details[0].path[0].toString(), propertyName);
    }
}

export function assertMissingPaymentPropertiesError(propertyName1 : string, validationMessage1: string, 
    propertyName2 : string, validationMessage2: string, 
    errorResponse : ErrorResponseObject) {
    assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
    assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);

    assert.isArray(errorResponse.details);
    assert.lengthOf(errorResponse.details, 2);

    assert.equal(errorResponse.details[0].message, validationMessage1);
    assert.isArray(errorResponse.details[0].path);
    if (errorResponse.details[0].path !== undefined) {
        assert.include(errorResponse.details[0].path[0].toString(), propertyName1);
    }

    assert.equal(errorResponse.details[1].message, validationMessage2);
    assert.isArray(errorResponse.details[1].path);
    if (errorResponse.details[1].path !== undefined) {
        assert.include(errorResponse.details[1].path[0].toString(), propertyName2);
    }
}
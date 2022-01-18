import chai from "chai";
chai.use(require('chai-uuid'));
import { getApp, closeServer, getUserService, getJWTService } from '../../server';
import {agent as request} from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { APPROVE_PAYMENT_ENDPOINT, AUTHENTICATE_ENDPOINT, CANCEL_PAYMENT_ENDPOINT, CREATE_PAYMENT_ENDPOINT, GET_PAYMENTS_ENDPOINT, GET_PAYMENT_ENDPOINT, HELLO_WORLD_ENDPOINT } from '../../constants';
import { MISSING_USERNAME_OR_PASSWORD_MESSAGE, WRONG_USERNAME_OR_PASSWORD_MESSAGE } from '../../controllers/authenticate-controller';
import { AuthenticateResponseObject } from '../../pocos/authenticate-response-object';
import { ErrorResponseObject } from '../../pocos/error-response-object';
import { ERROR_ALREADY_APPROVED_CODE, ERROR_ALREADY_APPROVED_MESSAGE, ERROR_ALREADY_CANCELLED_CODE, ERROR_ALREADY_CANCELLED_MESSAGE, ERROR_AUTH_TOKEN_EXPIRED_CODE, ERROR_AUTH_TOKEN_EXPIRED_MESSAGE, ERROR_CANNOT_APPROVE_CODE, ERROR_CANNOT_APPROVE_MESSAGE, ERROR_CANNOT_CANCEL_CODE, ERROR_CANNOT_CANCEL_MESSAGE, ERROR_NOT_FOUND_CODE, ERROR_NOT_FOUND_MESSAGE, ERROR_UNAUTHORIZED_CODE, ERROR_UNAUTHORIZED_MESSAGE, ERROR_VALIDATION_CODE, ERROR_VALIDATION_MESSAGE } from '../../enums/api-error-codes';
import { PaymentObject } from '../../pocos/payment-object';
import { assertCreatedPayment, assertMissingPropertyError, assertMissingPaymentPropertiesError, assertPayment } from "./payment-helper";
import { string } from "zod";

const assert = chai.assert;

let app = getApp();

describe('Payments API Integration Tests', () => {

    const aUserForTesting = {
        username: 'aUserForTesting',
        plaintextPassword: 'aPasswordForTesting'
    }

    const aUserThatDoesNotExist = {
        username: 'aUserThatDoesNotExist',
        plaintextPassword: 'aPasswordForThisUser'
    }

    const aTestPayment = {
        payeeId: 'cffd7c1f-e158-4c5a-97b8-7735dd56eb7a',
        payerId: '7e916836-0a91-4ee0-be2d-3ccebdcd7483',
        paymentSystem: 'ingenico',
        paymentMethod: 'mastercard',
        amount: 10.25,
        currency: 'USD',
        comment: 'Salary for March 2021'
    }

    const aPaymentWithAmountAsString = {
        payeeId: 'cffd7c1f-e158-4c5a-97b8-7735dd56eb7b',
        payerId: '7e916836-0a91-4ee0-be2d-3ccebdcd7484',
        paymentSystem: 'ingenico',
        paymentMethod: 'mastercard',
        amount: 'ABC',
        currency: 'USD',
        comment: 'Salary for April 2021'
    }

    let aCreatedTestPayment : PaymentObject;

    const aSecondTestPayment = {
        payeeId: '96313259-2c55-436c-964c-cf705a7c7425',
        payerId: 'aab770fd-d5e0-4110-a484-b8ff978c1402',
        paymentSystem: 'ingenico',
        paymentMethod: 'visa',
        amount: 35,
        currency: 'EUR',
        comment: 'A really large description to test how much the maximum length of a description can be.'
    }

    let aCreatedSecondTestPayment : PaymentObject;

    const aPaymentIdThatDoesNotExist = 'db6f7e77-ebc9-465b-ba70-d0431fe08f34';

    let anApprovedPaymentId : string;
    let aCancelledPaymentId : string;

    let validUserToken : string;

    async function getUserToken() : Promise<string> {
        const res = await request(app)
            .post(AUTHENTICATE_ENDPOINT)
            .send({ username: aUserForTesting.username, password : aUserForTesting.plaintextPassword });
        const authenticateResponse : AuthenticateResponseObject = res.body;
        return authenticateResponse.authToken;
    }

    before(done => {
    app.on("paymentsAPIStarted", async function(){
            await getUserService().addUserForTesting(aUserForTesting);
            validUserToken = await getUserToken();
            done();
        });
    });

    after(() => {
        closeServer();
    })

    describe('Hello World Integration Tests', () => {

        it('should return hello world', async () => {
            const res = await request(app).get(HELLO_WORLD_ENDPOINT);
            assert.equal(res.text, 'Hello World!');
        })

        it('should return status ok', async () => {
            const res = await request(app).get(HELLO_WORLD_ENDPOINT);
            assert.equal(res.statusCode, StatusCodes.OK);
        })

    })

    describe('Authenticate Integration Tests', () => {

        it('correct username and password should return ok', async () => {
            const res = await request(app)
                .post(AUTHENTICATE_ENDPOINT)
                .send({ username: aUserForTesting.username, password : aUserForTesting.plaintextPassword });
            assert.equal(res.statusCode, StatusCodes.OK);
            const authenticateResponse : AuthenticateResponseObject = res.body;
            assert.typeOf(authenticateResponse.authToken, 'string');
            assert.typeOf(authenticateResponse.expiresIn, 'string');
            assert.isNotEmpty(authenticateResponse.authToken);
            assert.isNotEmpty(authenticateResponse.expiresIn);
        })

        it('missing username should return error', async () => {
            const res = await request(app)
                .post(AUTHENTICATE_ENDPOINT)
                .send({ password : aUserThatDoesNotExist.plaintextPassword });
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
            assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);

            assert.isArray(errorResponse.details);
            assert.lengthOf(errorResponse.details, 1);
            assert.equal(errorResponse.details[0].message, MISSING_USERNAME_OR_PASSWORD_MESSAGE);

        })

        it('missing password should return error', async () => {
            const res = await request(app)
                .post(AUTHENTICATE_ENDPOINT)
                .send({ username : aUserThatDoesNotExist.username });
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
            assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);

            assert.isArray(errorResponse.details);
            assert.lengthOf(errorResponse.details, 1);
            assert.equal(errorResponse.details[0].message, MISSING_USERNAME_OR_PASSWORD_MESSAGE);
        })

        it('empty username should return error', async () => {
            const res = await request(app)
                .post(AUTHENTICATE_ENDPOINT)
                .send({ username : '   ',
                    password : aUserThatDoesNotExist.plaintextPassword });
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
            assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);

            assert.isArray(errorResponse.details);
            assert.lengthOf(errorResponse.details, 1);
            assert.equal(errorResponse.details[0].message, MISSING_USERNAME_OR_PASSWORD_MESSAGE);
        })

        it('empty password should return error', async () => {
            const res = await request(app)
                .post(AUTHENTICATE_ENDPOINT)
                .send({ username : aUserThatDoesNotExist.username,
                    password : '   ' });
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
            assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);

            assert.isArray(errorResponse.details);
            assert.lengthOf(errorResponse.details, 1);
            assert.equal(errorResponse.details[0].message, MISSING_USERNAME_OR_PASSWORD_MESSAGE);
        })

        it('wrong user should return error', async () => {
            const res = await request(app)
                .post(AUTHENTICATE_ENDPOINT)
                .send({ username : aUserThatDoesNotExist.username,
                    password : aUserThatDoesNotExist.plaintextPassword });
            assert.equal(res.statusCode, StatusCodes.UNAUTHORIZED);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
            assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);

            assert.isArray(errorResponse.details);
            assert.lengthOf(errorResponse.details, 1);
            assert.equal(errorResponse.details[0].message, WRONG_USERNAME_OR_PASSWORD_MESSAGE);
        })

        it('correct user, wrong password should return error', async () => {
            const res = await request(app)
                .post(AUTHENTICATE_ENDPOINT)
                .send({ username : aUserForTesting.username,
                    password : 'this is a wrong password' });
            assert.equal(res.statusCode, StatusCodes.UNAUTHORIZED);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
            assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);

            assert.isArray(errorResponse.details);
            assert.lengthOf(errorResponse.details, 1);
            assert.equal(errorResponse.details[0].message, WRONG_USERNAME_OR_PASSWORD_MESSAGE);
        })

    })

    describe('Unauthorised user Integration Tests', () => {

        it('when user is not authorised should return error', async () => {
            const res = await request(app).get(GET_PAYMENTS_ENDPOINT);
            assert.equal(res.statusCode, StatusCodes.UNAUTHORIZED);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_UNAUTHORIZED_CODE);
            assert.equal(errorResponse.message, ERROR_UNAUTHORIZED_MESSAGE);
        })

        it('when user provides expired token should return error', async () => {
            const userExpiredJWTOutput = await getJWTService().getUserExpiredJWT({ username : aUserForTesting.username });

            const res = await request(app)
                .get(GET_PAYMENTS_ENDPOINT)
                .set('Authorization', 'bearer ' + userExpiredJWTOutput.token);
            assert.equal(res.statusCode, StatusCodes.UNAUTHORIZED);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_AUTH_TOKEN_EXPIRED_CODE);
            assert.equal(errorResponse.message, ERROR_AUTH_TOKEN_EXPIRED_MESSAGE);
        })

    })

    describe('Payments Integration Tests List, Create, Get', () => {

        it('without any payments should return empty array', async () => {
            const res = await request(app)
                .get(GET_PAYMENTS_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.OK);

            assert.isArray(res.body);
            assert.lengthOf(res.body, 0);
        })

        it('create a payment should return ok', async () => {
            const res = await request(app)
                .post(CREATE_PAYMENT_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken)
                .send(aTestPayment);
            assert.equal(res.statusCode, StatusCodes.CREATED);

            const payment : PaymentObject = res.body;
            
            assertCreatedPayment(aTestPayment, payment);

            aCreatedTestPayment = payment;
        })

        it('should return exactly one payment', async () => {
            const res = await request(app)
                .get(GET_PAYMENTS_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.OK);

            assert.isArray(res.body);
            assert.lengthOf(res.body, 1);

            const payments : PaymentObject[] = res.body;

            assertCreatedPayment(aTestPayment, payments[0]);
        })

        it('missing payeeId should return error', async () => {
            let paymentMissingPayeeId = { ...aTestPayment };
            paymentMissingPayeeId.payeeId = '';
            const res = await request(app)
                .post(CREATE_PAYMENT_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken)
                .send(paymentMissingPayeeId);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assertMissingPropertyError('payeeId', 'Invalid uuid', errorResponse);
        })

        it('wrong payerId should return error', async () => {
            let paymentMissingPayerId = { ...aTestPayment };
            paymentMissingPayerId.payerId = '1234-abcd';
            const res = await request(app)
                .post(CREATE_PAYMENT_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken)
                .send(paymentMissingPayerId);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assertMissingPropertyError('payerId', 'Invalid uuid', errorResponse);
        })

        it('empty paymentMethod should return error', async () => {
            let paymentEmptyPaymentMethod = { ...aTestPayment };
            paymentEmptyPaymentMethod.paymentMethod = '';
            const res = await request(app)
                .post(CREATE_PAYMENT_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken)
                .send(paymentEmptyPaymentMethod);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assertMissingPropertyError('paymentMethod', 'Should be at least 1 characters', errorResponse);
        })

        it('empty paymentSystem and empty currency should return error with multiple details', async () => {
            let paymentEmptyPaymentSystemAndCurrency = { ...aTestPayment };
            paymentEmptyPaymentSystemAndCurrency.paymentSystem = '';
            paymentEmptyPaymentSystemAndCurrency.currency = '';
            const res = await request(app)
                .post(CREATE_PAYMENT_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken)
                .send(paymentEmptyPaymentSystemAndCurrency);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assertMissingPaymentPropertiesError('paymentSystem', 'Should be at least 1 characters', 
                'currency', 'Should be at least 1 characters', 
                errorResponse);
        })

        it('wrong amount should return error', async () => {
            const res = await request(app)
                .post(CREATE_PAYMENT_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken)
                .send(aPaymentWithAmountAsString);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assertMissingPropertyError('amount', 'Expected number, received string', errorResponse);
        })

        it('create a second payment should return ok', async () => {
            const res = await request(app)
                .post(CREATE_PAYMENT_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken)
                .send(aSecondTestPayment);
            assert.equal(res.statusCode, StatusCodes.CREATED);

            const payment : PaymentObject = res.body;
            
            assertCreatedPayment(aSecondTestPayment, payment);

            aCreatedSecondTestPayment = payment;
        })

        it('should return exactly two payments', async () => {
            const res = await request(app)
                .get(GET_PAYMENTS_ENDPOINT)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.OK);

            assert.isArray(res.body);
            assert.lengthOf(res.body, 2);

            const payments : PaymentObject[] = res.body;

            assertCreatedPayment(aTestPayment, payments[0]);
            assertCreatedPayment(aSecondTestPayment, payments[1]);
        })

        it('should get the payment', async () => {
            const getPaymentEndpoint = GET_PAYMENT_ENDPOINT.replace(':id', aCreatedTestPayment.id);

            const res = await request(app)
                .get(getPaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.OK);

            assert.isObject(res.body);

            const payment : PaymentObject = res.body;

            assertPayment(payment, aCreatedTestPayment);
        })

        it('a missing payment id should get not found', async () => {
            const getPaymentEndpoint = GET_PAYMENT_ENDPOINT.replace(':id', aPaymentIdThatDoesNotExist);

            const res = await request(app)
                .get(getPaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.NOT_FOUND);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_NOT_FOUND_CODE);
            assert.equal(errorResponse.message, ERROR_NOT_FOUND_MESSAGE);
        })

        it('a wrong payment id should return validation error', async () => {
            const aWrongPaymentId = 'ABCD-1234';
            const getPaymentEndpoint = GET_PAYMENT_ENDPOINT.replace(':id', aWrongPaymentId);

            const res = await request(app)
                .get(getPaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
            assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);
            assertMissingPropertyError('id', 'Invalid uuid', errorResponse);
        })

    })

    describe('Payments Integration Tests Approve, Cancel', () => {

        it('should approve the payment', async () => {
            const approvePaymentEndpoint = APPROVE_PAYMENT_ENDPOINT.replace(':id', aCreatedTestPayment.id);

            const res = await request(app)
                .put(approvePaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.OK);

            assert.isEmpty(res.body);

            anApprovedPaymentId = aCreatedTestPayment.id;
        })

        it('should return already approved error', async () => {
            const approvePaymentEndpoint = APPROVE_PAYMENT_ENDPOINT.replace(':id', anApprovedPaymentId);

            const res = await request(app)
                .put(approvePaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_ALREADY_APPROVED_CODE);
            assert.equal(errorResponse.message, ERROR_ALREADY_APPROVED_MESSAGE);
        })

        it('a wrong payment id when approving should return validation error', async () => {
            const aWrongPaymentId = 'ABCD-1234';
            const approvePaymentEndpoint = APPROVE_PAYMENT_ENDPOINT.replace(':id', aWrongPaymentId);

            const res = await request(app)
                .put(approvePaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_VALIDATION_CODE);
            assert.equal(errorResponse.message, ERROR_VALIDATION_MESSAGE);
            assertMissingPropertyError('id', 'Invalid uuid', errorResponse);
        })

        it('a missing payment id when approving should get not found', async () => {
            const approvePaymentEndpoint = APPROVE_PAYMENT_ENDPOINT.replace(':id', aPaymentIdThatDoesNotExist);

            const res = await request(app)
                .put(approvePaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.NOT_FOUND);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_NOT_FOUND_CODE);
            assert.equal(errorResponse.message, ERROR_NOT_FOUND_MESSAGE);
        })

        it('should cancel the payment', async () => {
            const cancelPaymentEndpoint = CANCEL_PAYMENT_ENDPOINT.replace(':id', aCreatedSecondTestPayment.id);

            const res = await request(app)
                .put(cancelPaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.OK);

            assert.isEmpty(res.body);

            aCancelledPaymentId = aCreatedSecondTestPayment.id;
        })

        it('should return already cancelled error', async () => {
            const cancelPaymentEndpoint = CANCEL_PAYMENT_ENDPOINT.replace(':id', aCancelledPaymentId);

            const res = await request(app)
                .put(cancelPaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_ALREADY_CANCELLED_CODE);
            assert.equal(errorResponse.message, ERROR_ALREADY_CANCELLED_MESSAGE);
        })

        it('should return cannot approve error', async () => {
            const approvePaymentEndpoint = APPROVE_PAYMENT_ENDPOINT.replace(':id', aCancelledPaymentId);

            const res = await request(app)
                .put(approvePaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_CANNOT_APPROVE_CODE);
            assert.equal(errorResponse.message, ERROR_CANNOT_APPROVE_MESSAGE);
        })

        it('should return cannot cancel error', async () => {
            const cancelPaymentEndpoint = CANCEL_PAYMENT_ENDPOINT.replace(':id', anApprovedPaymentId);

            const res = await request(app)
                .put(cancelPaymentEndpoint)
                .set('Authorization', 'bearer ' + validUserToken);
            assert.equal(res.statusCode, StatusCodes.BAD_REQUEST);

            const errorResponse : ErrorResponseObject = res.body;
            assert.equal(errorResponse.code, ERROR_CANNOT_CANCEL_CODE);
            assert.equal(errorResponse.message, ERROR_CANNOT_CANCEL_MESSAGE);
        })

    })

})
import { assert } from 'chai';
import { getApp, closeServer, getUserService } from '../../server';
import {agent as request} from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { AUTHENTICATE_ENDPOINT, HELLO_WORLD_ENDPOINT } from '../../constants';
import { MISSING_USERNAME_OR_PASSWORD_MESSAGE, WRONG_USERNAME_OR_PASSWORD_MESSAGE } from '../../controllers/authenticate-controller';
import { AuthenticateResponseObject } from '../../pocos/authenticate-response-object';
import { ErrorResponseObject } from '../../pocos/error-response-object';
import { ERROR_VALIDATION_CODE, ERROR_VALIDATION_MESSAGE } from '../../enums/api-error-codes';

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

    before(done => {
    app.on("paymentsAPIStarted", function(){
            getUserService().addUserForTesting(aUserForTesting);
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
/*
    describe('List Payments Integration Tests', () => {

        const listPaymentsEndpoint = '/payments';

        it('should return an empty list', async () => {
            const res = await request(app).get(listPaymentsEndpoint);
            assert.equal(res.body, '[]');
        })

        it('should return status ok', async () => {
            const res = await request(app).get(listPaymentsEndpoint);
            assert.equal(res.statusCode, StatusCodes.OK);
        })

    })
*/
})
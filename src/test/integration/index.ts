import { assert } from 'chai';
import { app, closeServer } from '../../server';
import {agent as request} from 'supertest';
import { StatusCodes } from 'http-status-codes';

describe('Payments API Integration Tests', () => {

    before(done => {
    app.on("paymentsAPIStarted", function(){
            done();
        });
    });

    after(() => {
        closeServer();
    })

    describe('Hello World Integration Tests', () => {

        it('should return hello world', async () => {
            const res = await request(app).get('/');
            console.log(res.text);
            assert.equal(res.text, 'Hello World!');
        })

        it('should return status ok', async () => {
            const res = await request(app).get('/');
            console.log(res.text);
            assert.equal(res.statusCode, StatusCodes.OK);
        })

    })
})
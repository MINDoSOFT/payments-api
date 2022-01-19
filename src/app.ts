import express from 'express'
import { Server } from 'http';
import bodyParser from 'body-parser';
import { CREATE_PAYMENT_ENDPOINT, GET_PAYMENT_ENDPOINT } from './constants';
import { createPaymentController } from './modules/payments/useCases/createPayment';
import { getPaymentController } from './modules/payments/useCases/getPayment';

const app = express()
const port = 3000;

let server: Server;

app.use(bodyParser.json());
//app.get('/', (req, res) => createPaymentController.execute(req, res))

app.post(CREATE_PAYMENT_ENDPOINT, (req, res) => createPaymentController.execute(req, res));

app.get(GET_PAYMENT_ENDPOINT, (req, res) => getPaymentController.execute(req, res));

function start () {
  server = app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
}

function stop () {
  server.close();
}

export {
  start,
  stop
}
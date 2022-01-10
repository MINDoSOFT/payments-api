
import bodyParser from 'body-parser';
import express from 'express';
import { AuthenticateRequest, AuthenticateResponse } from './interfaces/routes/authenticate';
import { ErrorDetail, ErrorResponse } from './interfaces/routes/error.js';

const app = express();
const port = 3000;

const ERROR_VALIDATION_CODE = 'ERR_VALIDATION';
const ERROR_VALIDATION_MESSAGE = 'Validation failed';

app.use(bodyParser.json());

app.get('/', (req: any, res: any) => {
  res.send('Hello World!')
});

app.post('/v1/authenticate/', function (req: AuthenticateRequest, res: AuthenticateResponse & ErrorResponse) {
  // https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#intersection-types

  if (req.body === undefined || req.body.username === undefined || req.body.password === undefined) {
    let detail = new ErrorDetail("Missing username and password")

    res.status(401)
    .json({
      code: ERROR_VALIDATION_CODE, 
      message: ERROR_VALIDATION_MESSAGE, 
      details: [detail]
    });
  }

  // TODO Hide this in env variables
  if (req.body.username != "serious_business" ||
    req.body.password != "suchPassw0rdSecure") {
    let detail = new ErrorDetail("Wrong username or password")

    res.status(401)
    .json({
      code: ERROR_VALIDATION_CODE, 
      message: ERROR_VALIDATION_MESSAGE, 
      details: [detail]
    });
  } else {
    // TODO Create a token that is valid for some time and return it to the client
    // TODO Persist the token in a database e.g. mongo ?

  }
    
  res.send()
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});
import { Options } from '@mikro-orm/core';
import { MongoHighlighter } from '@mikro-orm/mongo-highlighter';
import { User } from './entities/User';
import { Payment } from './entities/Payment';
import { PaymentEntity } from './entities/PaymentEntity';

const mongoDbHost = process.env.MONGO_DB_HOST;

const ormOptions: Options = {
  type: 'mongo',
  entities: [User, Payment, PaymentEntity],
  dbName: 'payments-api-db',
  highlighter: new MongoHighlighter(),
  debug: true,
  user: 'an-invalid-user',
  password: 'an-invalid-password',
  clientUrl: `mongodb://${mongoDbHost}:27017`
};

export default ormOptions;

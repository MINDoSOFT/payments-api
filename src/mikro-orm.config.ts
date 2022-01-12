import { Options } from '@mikro-orm/core';
import { MongoHighlighter } from '@mikro-orm/mongo-highlighter';
import { User } from './entities/User';
import { Payment } from './entities/Payment';

const ormOptions: Options = {
  type: 'mongo',
  entities: [User, Payment],
  dbName: 'payments-api-db',
  highlighter: new MongoHighlighter(),
  debug: true,
  user: 'an-invalid-user',
  password: 'an-invalid-password',
};

export default ormOptions;
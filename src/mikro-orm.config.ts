import { Options } from '@mikro-orm/core';
import { MongoHighlighter } from '@mikro-orm/mongo-highlighter';
import { User } from './entities/User';

const options: Options = {
  type: 'mongo',
  entities: [User],
  dbName: 'payments-api-db',
  highlighter: new MongoHighlighter(),
  debug: true,
  user: 'root',
  password: 'rootpassword',
};

export default options;
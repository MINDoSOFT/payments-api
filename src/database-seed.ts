import 'reflect-metadata';
import { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/core';
import { User } from './entities/User.js';
import NodeVault from 'node-vault';
import { VaultCredsResponse } from './interfaces/VaultCredsResponse.js';
import ormOptions from './mikro-orm.config.js';

import { readFileSync } from 'fs';
import { CreateUserObject } from './pocos/user-object.js';

const roleId = readFileSync('./vault-data/payments-api-role_id', 'utf8')
const secretId = readFileSync('./vault-data/payments-api-secret_id', 'utf8')

export const DI = {} as {
  orm: MikroORM;
  em: EntityManager;
  userRepository: EntityRepository<User>;
};

const vaultOptions = {
  apiVersion: 'v1', // default
  endpoint: 'http://127.0.0.1:8200' // default
};

(async () => {
  const vault = NodeVault(vaultOptions);

  await vault.approleLogin({ role_id: roleId, secret_id: secretId });

  const mongodbCreds: VaultCredsResponse = await vault.read(
    'mongodb/creds/payments-api-client'
  );

  ormOptions.user = mongodbCreds.data.username;
  ormOptions.password = mongodbCreds.data.password;

  DI.orm = await MikroORM.init(ormOptions);
  DI.em = DI.orm.em;
  DI.userRepository = DI.orm.em.getRepository(User);

  const username1 = 'serious_business';

  if ((await DI.userRepository.count({ username: username1 })) === 0) {
    const userToCreate : CreateUserObject = {
      username : username1,
      plaintextPassword : 'suchPassw0rdSecure'
    }
    const user = new User(userToCreate);
    await DI.userRepository.persist(user).flush();
  } else {
    console.log(`User: ${username1} already exists.`);
  }
})();

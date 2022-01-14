import 'reflect-metadata';
import { EntityManager, EntityRepository, MikroORM } from '@mikro-orm/core';
import { User } from './entities/User.js';
import NodeVault from 'node-vault';
import { VaultCredsResponse } from './interfaces/VaultCredsResponse.js';
import ormOptions from './mikro-orm.config.js';

const roleId = '37a24f4d-156a-ea18-6943-d69386b6afb6'; // TODO Put these in env variables
const secretId = '9e683092-c032-0a0f-2908-016c0d3fcccf';

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
    const user = new User(username1, 'suchPassw0rdSecure');
    await DI.userRepository.persist(user).flush();
  } else {
    console.log(`User: ${username1} already exists.`);
  }
})();

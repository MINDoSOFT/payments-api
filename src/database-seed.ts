import 'reflect-metadata';
import { EntityManager, EntityRepository, MikroORM, RequestContext } from '@mikro-orm/core';
import { User } from './entities/User.js';

export const DI = {} as {
  orm: MikroORM,
  em: EntityManager,
  userRepository: EntityRepository<User>,
};

(async () => {

    DI.orm = await MikroORM.init();
    DI.em = DI.orm.em;
    DI.userRepository = DI.orm.em.getRepository(User);
    
    const username1 = 'serious_business'

    if (await DI.userRepository.count({username: username1}) === 0) {
        const user = new User(username1, "suchPassw0rdSecure");
        await DI.userRepository.persist(user).flush();
    } else {
        console.log(`User: ${username1} already exists.`)
    }
  
  })();
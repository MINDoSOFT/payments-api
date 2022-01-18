import { Connection, EntityManager, IDatabaseDriver, MikroORM } from '@mikro-orm/core';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { initMongoOutput } from '../interfaces/services/mongo-service-interface';
import realMongoOrmOptions from '../mikro-orm.config';
import { Options } from '@mikro-orm/core';
import { MongoNotInitialisedError } from '../errors/mongo-service-error';
import { EntityRepository } from '@mikro-orm/mongodb';
import { User } from '../entities/User';
import { Payment } from '../entities/Payment';

export enum MongoServiceType {
    REAL = 'Real',
    INMEMORY = 'In-memory'
}

export class MongoService {
    private mongoType: MongoServiceType;
    private ormOptions: Options;
    private orm: MikroORM | void;
    private mongoInMemoryServer: MongoMemoryServer | void;

    constructor (mongoType: MongoServiceType, username: string, password: string) {
        this.mongoType = mongoType;
        this.ormOptions = realMongoOrmOptions;
        this.ormOptions.user = username;
        this.ormOptions.password = password;
        this.orm = undefined;
        this.mongoInMemoryServer = undefined;
    }

    init = async (): Promise<initMongoOutput> => {
        try {
            if (this.mongoType == MongoServiceType.INMEMORY) {
                this.mongoInMemoryServer = await MongoMemoryServer.create({ instance: { port: 37575, auth: false }});
                const uri = this.mongoInMemoryServer.getUri();
                this.ormOptions.clientUrl = uri;
                this.ormOptions.user = undefined;
                this.ormOptions.password = undefined;
            }

            this.orm = await MikroORM.init(this.ormOptions);            
        } catch (error) {
            throw new MongoNotInitialisedError();
        }

        console.log(`Mongo ${this.mongoType} initialised OK.`);

        return { success: true };
    }

    getEntityManager = () : EntityManager<IDatabaseDriver<Connection>> => {
        if (!this.orm) throw new MongoNotInitialisedError();
        return this.orm.em;
    }

    closeOrm = () => {
        if (!this.orm) throw new MongoNotInitialisedError();
        this.orm.close();
        if (this.mongoType == MongoServiceType.INMEMORY && this.mongoInMemoryServer) {
            this.mongoInMemoryServer.stop();
        }
    }

    getUserRepository = () : EntityRepository<User> => {
        if (!this.orm) throw new MongoNotInitialisedError();
        return this.orm.em.getRepository(User);
    }

    getPaymentRepository = () : EntityRepository<Payment> => {
        if (!this.orm) throw new MongoNotInitialisedError();
        return this.orm.em.getRepository(Payment);
    }

}
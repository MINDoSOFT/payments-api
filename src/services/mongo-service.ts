import { Connection, EntityManager, IDatabaseDriver, MikroORM } from '@mikro-orm/core';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { initMongoInput, initMongoOutput } from '../interfaces/services/mongo-service-interface';
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
    private static instance: MongoService;

    private mongoType: MongoServiceType | undefined;
    private ormOptions: Options | undefined;
    private orm: MikroORM | undefined;
    private mongoInMemoryServer: MongoMemoryServer | undefined;

    private constructor () {
        this.mongoType = undefined; // To bypass the empty constructor error
    }

    public static getInstance(): MongoService {
        if (!MongoService.instance) {
            MongoService.instance = new MongoService();
        }

        return MongoService.instance;
    }

    init = async (input: initMongoInput): Promise<initMongoOutput> => {
        try {
            this.mongoType = input.mongoType;
            this.ormOptions = realMongoOrmOptions;
            this.ormOptions.user = input.username;
            this.ormOptions.password = input.password;
            this.orm = undefined;
            this.mongoInMemoryServer = undefined;
            
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
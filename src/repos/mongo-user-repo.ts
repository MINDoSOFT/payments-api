import { EntityRepository } from "@mikro-orm/core";
import { User } from "../entities/User";
import { UserObject, CreateUserObject } from "../pocos/user-object";
import { MongoService } from "../services/mongo-service";
import { IUserRepo } from "./user-repo";

export class MongoUserRepo implements IUserRepo {
    private userRepository : EntityRepository<User>;

    constructor (mongoService : MongoService) {
        this.userRepository = mongoService.getEntityManager().getRepository(User);
    }

    async findByUsername(username: string): Promise<UserObject | undefined> {
        const user = await this.userRepository.findOne({ username : username })
        if (user == null)
            return;

        const userObject = user.mapEntityToObject();

        return userObject;
    }

    async create(userToCreate: CreateUserObject): Promise<UserObject> {
        const user = new User(userToCreate);

        await this.userRepository.persist(user).flush();

        return user.mapEntityToObject();
    }

}
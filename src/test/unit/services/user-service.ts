import { stubInterface } from "ts-sinon";
import { UserObject } from "../../../pocos/user-object";
import { IUserRepo } from "../../../repos/user-repo";
import bcrypt = require('bcrypt');
import { UserService } from "../../../services/user-service";
import { assert } from 'chai';

describe('User Service', () => {
    it('should return the user', async () => {
        const testUserPassword = 'aVerySafePassword1234';
        const saltRounds = 1;
        const testUser : UserObject = {
            id : '750789de-a6d2-4d08-afd3-ec5de5c43449',
            username: 'aTestUser',
            password: bcrypt.hashSync(testUserPassword, saltRounds)
        };

        const userRepo = stubInterface<IUserRepo>({
            findByUsername: Promise.resolve(testUser)
        });

        const userService = new UserService(userRepo);

        const getUserOutput = await userService.getUser({ username : testUser.username });

        const user = getUserOutput.user;
        assert.equal(testUser.id, user.id);
        assert.equal(testUser.username, user.username);
        assert.equal(testUser.password, user.password);
    });

});
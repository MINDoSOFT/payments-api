import { stubInterface } from "ts-sinon";
import { IUserRepo } from "../../../repos/user-repo";

import { UserService } from "../../../services/user-service";
import { assert } from 'chai';
import { getTestUser } from "./user-helper";

describe('User Service', () => {
    it('should return the user', async () => {
        const getTestUserOutput = getTestUser();
        const testUser = getTestUserOutput.user;

        const userRepo = stubInterface<IUserRepo>({
            findByUsername: Promise.resolve(testUser)
        });

        const userService = new UserService(userRepo);

        const getUserResult = await userService.getUser({ username : testUser.username });

        if (getUserResult.type !== 'GetUserSuccess') {
            assert.fail();
        } else {
            const user = getUserResult.user;
            assert.equal(testUser.id, user.id);
            assert.equal(testUser.username, user.username);
            assert.equal(testUser.password, user.password);
        }
    });

});
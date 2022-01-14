import { EntityRepository } from '@mikro-orm/core';
import { assert } from 'chai';
import { User } from '../../../entities/User';
const sinon = require('sinon');
import bcrypt = require('bcrypt');
import { UserService } from '../../../services/user-service';

let userRepository: EntityRepository<User>;

const testUserPassword = 'aVerySafePassword1234';
const saltRounds = 1;
const testUser = {
    id : '750789de-a6d2-4d08-afd3-ec5de5c43449',
    username: 'aTestUser',
    password: bcrypt.hashSync(testUserPassword, saltRounds)
}

let userService: UserService;

describe('User Service', () => {
    before(() => {
        sinon
            .stub(userRepository, 'findOne')
            .yields({ 
                _id: testUser.id,
                username: testUser.username,
                password: testUser.password
            }
        )

        userService = new UserService(userRepository);
    })

    after(() => {
        sinon
            .stub(userRepository).restore();
    })

    it('should return the user', async () => {
        const getUserOutput = await userService.getUser({ username : testUser.username });
        const user = getUserOutput.user;
        assert.equal(testUser.id, user._id);
        assert.equal(testUser.username, user.username);
    });

});
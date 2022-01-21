import { stubInterface } from "ts-sinon";
import { IUserRepo } from "../../../repos/user-repo";

import { UserService } from "../../../services/user-service";
import { assert } from 'chai';
import { getTestUser } from "./user-helper";

describe('User Service', () => {
    it('should return the user', async () => {
        // Given
        const getTestUserOutput = getTestUser();
        const testUser = getTestUserOutput.user;

        const userRepo = stubInterface<IUserRepo>({
            findByUsername: Promise.resolve(testUser)
        });

        const userService = new UserService(userRepo);

        // When
        const getUserResult = await userService.getUser({ username : testUser.username });

        // Then
        if (getUserResult.type !== 'GetUserSuccess') {
            assert.fail();
        } else {
            const user = getUserResult.user;
            assert.equal(testUser.id, user.id);
            assert.equal(testUser.username, user.username);
            assert.equal(testUser.password, user.password);

            assert.isTrue(userRepo.findByUsername.calledOnce);
        }
    });

    it('should return user not found error', async () => {
        // Given
        const userRepo = stubInterface<IUserRepo>({
            findByUsername: Promise.resolve(undefined)
        });

        const userService = new UserService(userRepo);

        // When
        const getUserResult = await userService.getUser({ username : 'just a string' });

        // Then
        if (getUserResult.type !== 'UserNotFoundError') {
            assert.fail();
        } else {
            assert.isTrue(userRepo.findByUsername.calledOnce);
        }
    });

    it('should return unexpected error', async () => {
        // Given
        const userRepo = stubInterface<IUserRepo>({
            findByUsername: undefined
        });

        userRepo.findByUsername.throwsException(new Error('An unexpected error'));

        const userService = new UserService(userRepo);

        // When
        const getUserResult = await userService.getUser({ username : 'just a string' });

        // Then
        if (getUserResult.type !== 'UnexpectedError') {
            assert.fail();
        } else {
            assert.isTrue(userRepo.findByUsername.calledOnce);
        }
    });

    it('should return validate user password success', async () => {
        // Given
        const getTestUserOutput = getTestUser();
        const testUser = getTestUserOutput.user;

        const userRepo = stubInterface<IUserRepo>({
            findByUsername: Promise.resolve(testUser)
        });

        const userService = new UserService(userRepo);

        // When
        const validateUserPasswordResult = await userService.validateUserPassword({ username : testUser.username, plainTextPassword : getTestUserOutput.plaintextPassword });

        // Then
        if (validateUserPasswordResult.type !== 'ValidateUserPasswordSuccess') {
            assert.fail();
        } else {
            assert.isTrue(userRepo.findByUsername.calledOnce);
        }
    });

    it('should return user password invalid for invalid password', async () => {
        // Given
        const getTestUserOutput = getTestUser();
        const testUser = getTestUserOutput.user;

        const userRepo = stubInterface<IUserRepo>({
            findByUsername: Promise.resolve(testUser)
        });

        const userService = new UserService(userRepo);

        // When
        const validateUserPasswordResult = await userService.validateUserPassword({ username : testUser.username, plainTextPassword : 'definitely not my password' });

        // Then
        if (validateUserPasswordResult.type !== 'UserPasswordInvalidError') {
            assert.fail();
        } else {
            assert.isTrue(userRepo.findByUsername.calledOnce);
        }
    });

    it('should return user password invalid for invalid username', async () => {
        // Given
        const getTestUserOutput = getTestUser();
        const testUser = getTestUserOutput.user;

        const userRepo = stubInterface<IUserRepo>({
            findByUsername: Promise.resolve(undefined)
        });

        const userService = new UserService(userRepo);

        // When
        const validateUserPasswordResult = await userService.validateUserPassword({ username : testUser.username, plainTextPassword : getTestUserOutput.plaintextPassword });

        // Then
        if (validateUserPasswordResult.type !== 'UserPasswordInvalidError') {
            assert.fail();
        } else {
            assert.isTrue(userRepo.findByUsername.calledOnce);
        }
    });

    it('should create the test user', async () => {
        // Given
        const getTestUserOutput = getTestUser();
        const testUser = getTestUserOutput.user;

        const userRepo = stubInterface<IUserRepo>({
            findByUsername: undefined,
            create: Promise.resolve(testUser)
        });

        const userService = new UserService(userRepo);

        // When
        const addUserForTestingResult = await userService.addUserForTesting({ username : testUser.username, plaintextPassword: getTestUserOutput.plaintextPassword });

        // Then
        if (addUserForTestingResult.type !== 'AddUserForTestingSuccess') {
            assert.fail();
        } else {
            assert.isTrue(userRepo.findByUsername.calledOnce);
            assert.isTrue(userRepo.create.calledOnce);
        }
    });

    it('should return user already exists error', async () => {
        // Given
        const getTestUserOutput = getTestUser();
        const testUser = getTestUserOutput.user;

        const userRepo = stubInterface<IUserRepo>({
            findByUsername: Promise.resolve(testUser),
            create: undefined
        });

        const userService = new UserService(userRepo);

        // When
        const addUserForTestingResult = await userService.addUserForTesting({ username : testUser.username, plaintextPassword: getTestUserOutput.plaintextPassword });

        // Then
        if (addUserForTestingResult.type !== 'UserAlreadyExistsError') {
            assert.fail();
        } else {
            assert.isTrue(userRepo.findByUsername.calledOnce);
            assert.isTrue(userRepo.create.notCalled);
        }
    });

});
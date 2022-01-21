import { UserObject } from "../../../pocos/user-object";
import bcrypt = require('bcrypt');

export function getTestUser() : {user: UserObject, plaintextPassword: string} {
    const testUserPassword = 'aVerySafePassword1234';
    const saltRounds = 1;
    const testUser : UserObject = {
        id : '750789de-a6d2-4d08-afd3-ec5de5c43449',
        username: 'aTestUser',
        password: bcrypt.hashSync(testUserPassword, saltRounds)
    };
    return { user: testUser, plaintextPassword: testUserPassword };
}
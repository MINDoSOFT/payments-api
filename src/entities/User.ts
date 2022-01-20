import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import bcrypt = require('bcrypt');
import { CreateUserObject, UserObject } from '../pocos/user-object';
import { CreateUserSchema } from '../schemas/user-schema';

@Entity()
export class User extends BaseEntity<User, '_id'> {
  @PrimaryKey()
  _id!: string;

  @Property()
  username!: string;

  @Property()
  password!: string;

  constructor(userToCreate: CreateUserObject) {
    super();

    if (!userToCreate) throw Error('Missing user');
    
    CreateUserSchema.parse(userToCreate);

    this.username = userToCreate.username;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(userToCreate.plaintextPassword, salt);
    this.password = hash;
  }

  public mapEntityToObject() : UserObject {
    const userObject : UserObject = {
      ...this,
      id : this._id
    }
    return userObject;
  }
}

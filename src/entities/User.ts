import { BaseEntity, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import bcrypt = require('bcrypt');

@Entity()
export class User extends BaseEntity<User, '_id'> {
  @PrimaryKey()
  _id!: string;

  @Property()
  username!: string;

  @Property()
  password!: string;

  constructor(username: string, plainTextPassword: string) {
    super();
    this.username = username;

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(plainTextPassword, salt);
    this.password = hash;
  }
}

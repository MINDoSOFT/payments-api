import { BaseEntity, Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User extends BaseEntity<User, 'id'> {

  @PrimaryKey()
  id!: number;

  @Property()
  username!: string;

  @Property()
  password!: string;

  constructor(username: string, password: string) {
    super();
    this.username = username;
    this.password = password;
  }
}
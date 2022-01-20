import { CreateUserObject, UserObject } from "../pocos/user-object";

export interface IUserRepo {
  findByUsername (username: string): Promise<UserObject | undefined>;
  create (user: CreateUserObject): Promise<UserObject>;
}
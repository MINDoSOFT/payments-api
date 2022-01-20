export interface CreateUserObject {
  username: string;
  plaintextPassword: string;
}

export interface UserObject {
  id: string;
  username: string;
  password: string;
}

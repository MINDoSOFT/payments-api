export interface getUserJWTInput {
  username: string;
}

export interface getUserJWTOutput {
  token: string;
  expiresIn: string;
}

export interface getUserJWTInput {
  username: string;
}

export interface getUserJWTOutput {
  token: string;
  expiresIn: string;
}

export interface getUserExpiredJWTInput {
  username: string;
}

export interface getUserExpiredJWTOutput {
  token: string;
  expiresIn: string;
}

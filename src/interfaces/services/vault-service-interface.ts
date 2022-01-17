export interface VaultOptions {
    apiVersion: string,
    endpoint: string
}

export interface getVaultCredentialsInput {
  path: string;
}

export interface getVaultCredentialsOutput {
  username: string;
  password: string;
}

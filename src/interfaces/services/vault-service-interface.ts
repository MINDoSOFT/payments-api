export interface VaultOptions {
    apiVersion: string,
    endpoint: string
}

export interface VaultServiceInterface {
  init (): Promise<void>;
  getCredentials (input : getVaultCredentialsInput): Promise<getVaultCredentialsOutput>;
}

export interface getVaultCredentialsInput {
  path: string;
}

export interface getVaultCredentialsOutput {
  username: string;
  password: string;
}

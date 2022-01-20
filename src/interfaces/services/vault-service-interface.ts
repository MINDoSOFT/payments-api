export interface VaultOptions {
    apiVersion: string,
    endpoint: string
}

export interface VaultServiceInterface {
  init (input : initVaultInput): Promise<void>;
  getCredentials (input : getVaultCredentialsInput): Promise<getVaultCredentialsOutput>;
}

export interface initVaultInput {
  vaultOptions: VaultOptions;
  roleId : string;
  secretId : string;
}

export interface getVaultCredentialsInput {
  path: string;
}

export interface getVaultCredentialsOutput {
  username: string;
  password: string;
}

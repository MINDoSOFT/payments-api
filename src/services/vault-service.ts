import NodeVault from "node-vault";
import { VaultCredentialsNotFoundError } from "../errors/vault-service-error";
import { getVaultCredentialsInput, getVaultCredentialsOutput, VaultOptions, VaultServiceInterface } from "../interfaces/services/vault-service-interface";
import { VaultCredsResponse } from "../interfaces/VaultCredsResponse";

export class VaultService implements VaultServiceInterface {
  private vaultOptions: VaultOptions;
  private roleId : string;
  private secretId : string;
  private vaultClient : NodeVault.client;

  constructor(vaultOptions: VaultOptions, roleId : string, secretId : string) {

    this.vaultOptions = vaultOptions;
    this.roleId = roleId;
    this.secretId = secretId;
    this.vaultClient = NodeVault(this.vaultOptions);
  }

  init = async (): Promise<void> => {
    await this.vaultClient.approleLogin({ role_id: this.roleId, secret_id: this.secretId })
    console.log('Vault Service instantiated OK.');
  }

  getCredentials = async (input : getVaultCredentialsInput): Promise<getVaultCredentialsOutput> => {
    const creds : VaultCredsResponse | void = await this.vaultClient.read(
        input.path
    );

    if (!creds) {
        throw new VaultCredentialsNotFoundError(input.path);
    }

    return { username : creds.data.username, password: creds.data.password };
  }

}

export class MockVaultService implements VaultServiceInterface {

  private username : string;
  private password : string;

  constructor(username : string, password : string) {

    this.username = username;
    this.password = password;
  }

  init = async (): Promise<void> => {
    console.log('Mock Vault Service instantiated OK.');
  }

  getCredentials = async (_input : getVaultCredentialsInput): Promise<getVaultCredentialsOutput> => {
    return { username : this.username, password: this.password };
  }

}
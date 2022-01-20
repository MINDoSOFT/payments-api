import NodeVault from "node-vault";
import { VaultCredentialsNotFoundError, VaultNotInitialisedError } from "../errors/vault-service-error";
import { getVaultCredentialsInput, getVaultCredentialsOutput, initVaultInput, VaultOptions, VaultServiceInterface } from "../interfaces/services/vault-service-interface";
import { VaultCredsResponse } from "../interfaces/VaultCredsResponse";

export class VaultService implements VaultServiceInterface {
  private static instance: VaultService;

  private vaultOptions: VaultOptions | undefined;
  private roleId : string | undefined;
  private secretId : string | undefined;
  private vaultClient : NodeVault.client | undefined;

  private constructor() {
    this.vaultOptions = undefined; // To bypass the empty constructor error
  }

  public static getInstance(): VaultService {
    if (!VaultService.instance) {
      VaultService.instance = new VaultService();
    }

    return VaultService.instance;
  }

  init = async (input : initVaultInput): Promise<void> => {
    this.vaultOptions = input.vaultOptions;
    this.roleId = input.roleId;
    this.secretId = input.secretId;
    this.vaultClient = NodeVault(this.vaultOptions);

    await this.vaultClient.approleLogin({ role_id: this.roleId, secret_id: this.secretId })
    console.log('Vault Service instantiated OK.');
  }

  getCredentials = async (input : getVaultCredentialsInput): Promise<getVaultCredentialsOutput> => {
    if (!this.vaultClient) throw new VaultNotInitialisedError();
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
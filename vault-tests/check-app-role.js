var options = {
    apiVersion: 'v1', // default
    endpoint: 'http://127.0.0.1:8200', // default
  };
  
import NodeVault from 'node-vault';
// get new instance of the client
const vault = NodeVault(options)

import { readFileSync } from 'fs';

try {
  const roleId = readFileSync('./vault-data/payments-api-role_id', 'utf8')
  const secretId = readFileSync('./vault-data/payments-api-secret_id', 'utf8')

  vault.approleLogin({ role_id: roleId, secret_id: secretId })
  .then(() => {
      return vault.read('mongodb/creds/payments-api-client');
  })
  .then((result) => {
      console.log(result);
  })
  .catch((err) => console.error(err.message));

} catch (err) {
  console.error(err)
}

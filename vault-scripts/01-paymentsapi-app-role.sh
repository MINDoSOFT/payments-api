#!/bin/bash

# Setup VAULT_ADDR and VAULT_TOKEN
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=root

# Enable AppRole and create a role:
vault auth enable approle
vault write auth/approle/role/payments-api token_policies="payments-api"

# Determine vault-agent path
if [[ -d "./vault-data" ]]; then
  vault_data_dir=./vault-data
else
  vault_data_dir=../vault-data
fi

# Write out a Role ID and Secret ID for local development
vault read -format=json auth/approle/role/payments-api/role-id \
  | jq -r '.data.role_id' > ${vault_data_dir}/payments-api-role_id
vault write -format=json -f auth/approle/role/payments-api/secret-id \
  | jq -r '.data.secret_id' > ${vault_data_dir}/payments-api-secret_id

if [[ -d "./vault-data" ]]; then
  vault_data_dir=./public/vault-data
else
  vault_data_dir=../public/vault-data
fi

mkdir -p ${vault_data_dir}

# Write out a Role ID and Secret ID for docker development
vault read -format=json auth/approle/role/payments-api/role-id \
  | jq -r '.data.role_id' > ${vault_data_dir}/payments-api-role_id
vault write -format=json -f auth/approle/role/payments-api/secret-id \
  | jq -r '.data.secret_id' > ${vault_data_dir}/payments-api-secret_id

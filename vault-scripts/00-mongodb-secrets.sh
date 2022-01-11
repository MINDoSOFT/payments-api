#!/bin/bash

# Setup VAULT_ADDR and VAULT_TOKEN
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=root

# Determine policy path
if [[ -f "./payments-api.hcl" ]]; then
  policy_file=./payments-api.hcl
else
  policy_file=../payments-api.hcl
fi

# Write a Policy
vault policy write payments-api ${policy_file}

vault secrets enable -path=mongodb database

vault write mongodb/config/payments-api-db \
    plugin_name=mongodb-database-plugin \
    allowed_roles="payments-api-client" \
    connection_url="mongodb://{{username}}:{{password}}@mongodb_container:27017/admin?tls=false" \
    username="root" \
    password="rootpassword"

vault write mongodb/roles/payments-api-client \
    db_name=payments-api-db \
    creation_statements='{ "db": "admin", "roles": [{ "role": "readWrite" }, {"role": "readWrite", "db": "payments-api-db"}] }' \
    default_ttl="1h" \
    max_ttl="24h"

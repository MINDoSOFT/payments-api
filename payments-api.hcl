# This policy allows the payments-api to access the Database Secrets engine

# Read dynamic database secrets
path "mongodb/creds/payments-api-client"
{
  capabilities = ["read"]
}

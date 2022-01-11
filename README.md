## To add the user please run:
```bash
npm run seed
```

## To create a new vault roleId and SecretId please run the following commands:
```bash
docker-compose up
./vault-scripts/00-mongodb-secrets.sh
./vault-scripts/01-paymentsapi-app-role.sh
```

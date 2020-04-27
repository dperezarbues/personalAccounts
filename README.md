# LEDGER APPLICATION

A simple application to manage your personal accounts.

# Functionality of the application

This application will allow creating/removing/updating/fetching ledgers/accounts and create/remove/update and fetch entries associated with them, providing at the same time a global overview of your finances.
You can also upload a ticket image to entries in a ledger, for that please use endpoint

```
/dev/ledgers/{{ledgerID}}/entries/{{entryId}}/attachment
```

# HOW to run
In order to deploy the application to your cluster, please update serverless.yml with your AWS credentials profile and run:

```
cd backend
npm install
npm run deploy
```

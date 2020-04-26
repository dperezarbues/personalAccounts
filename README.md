# LEDGER APPLICATION

A simple application to manage your personal accounts.

# Functionality of the application

This application will allow creating/removing/updating/fetching ledgers/accounts and create/remove/update and fetch entries associated with them, providing at the same time a global overview of your finances.

# HOW to use
The application will be running for a few days in AWS cluster, you can use the provided postman collection to execute calls to the API.

The postman collection has two valid Authentication Tokens (corresponding with two valid users) within their variables (authToken1 and authToken2). Using them you can create ledgers and items for each user.

The application already has some mock data to ease your life when using the API

# HOW to run
In order to deploy the application to your cluster, please update serverless.yml with your AWS credentials profile and run:

```
cd backend
npm install
npm run deploy
```

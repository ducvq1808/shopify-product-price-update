
# Shopify Product Price Update

- Allow sync products from Shopify to local database.
- Allow upload csv to update product prices

## Installation

Clone project and install with npm

```bash
  npm install
```

Init database

```bash
  npx knex migrate:latest
```

Duplicate .env.sample file into .env and update these environment variables

```bash
  SHOPIFY_STORE_NAME=<your-store-name>
  SHOPIFY_APP_ACCESS_TOKEN=<your-app-access-token>
```

Start the app

```bash
  npm run start
```

Start the app in development mode

```bash
  npm run dev
```
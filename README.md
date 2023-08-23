
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
## API Reference

#### Get all products saved in database

```http
  GET /api/products
```

#### Sync products from Shopify to database

```http
  GET /api/sync-products
```

#### Take csv file and update Shopify product prices

```http
  POST /api/update-prices-shopify
```

| Parameter | Type     | Description                       |
| :-------- | :------- | :-------------------------------- |
| `file`      | `file` | **Required**. CSV File contains two columns: **product_id** and **new_price** |




## Usage

**Step 1**: Run sync-products API to sync all products to database http://localhost:3000/sync-products

**Step 2**: Open the interface to upload file at http://localhost:3000/

**Step 3**: Upload the csv file following correct format (see **uploads/sample.csv**) and click submit button



## Challenges

#### There is no GraphQL endpoint to get all products

-> Use GraphQL pagination

#### GraphQL API Rate Limit

-> Use ``shopify-api-node`` package which have build-in mechanisms for avoiding API Rate Limit. 


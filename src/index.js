require('dotenv').config();

const fs = require('fs');
const express = require('express');
const csv = require('csv-parser');
const fileUpload = require('express-fileupload');
const { Model } = require('objection');
const db = require('../config/database');
const Products = require('./models/Products');
const Shopify = require('shopify-api-node');

const fileExists = require('./middleware/fileExist');
const fileExtLimiter = require('./middleware/fileExtLimiter');
const fileSizeLimiter = require('./middleware/fileSizeLimiter');

const server = express();

const shopify = new Shopify({
  shopName: process.env.SHOPIFY_STORE_NAME,
  accessToken: process.env.SHOPIFY_APP_ACCESS_TOKEN,
  autoLimit: true,
});

server.get('/', (req, res) => {
  //Send index.html file as response
  res.sendFile('index.html', { root: __dirname });
});

server.get('/products', async (req, res) => {
  try {
    const products = await Products.query();
    res.json({ status: "success", products: products });
  } catch (error) {
    console.error('Error getting products from database:', error);
    res.status(500).json({ status: "error", message: error });
  }
  
});

//Use Shopify GraphQL API to fetch all products variants from given store and save them to database
server.get('/sync-products', async (req, res) => {
  try {
    const products = await fetchAllProductVariants();

    //Truncate products table
    await Products.query().truncate();

    //Insert products to database. Use for loop because batch insert does not work with sqlite3
    for (const product of products) {
      await Products.query().insert(product);
    }

    res.json(products);
  } catch (error) {
    console.log('Error syncing products:', error);
    res.status(500).json({ status: "error", message: error });
  }
});

//Endpoint to receive uploaded csv file and use it to update products price in database and Shopify store
server.post('/update-prices-shopify',
  fileUpload({ createParentPath: true }),
  fileExists,
  fileExtLimiter(['.csv']),
  fileSizeLimiter,
  async (req, res) => {
    try{
      const file = req.files.file;
  
      //Generate file path. Add timestamp to file name to avoid overwriting existing files
      const filePath = './uploads/' + Date.now() + '_' + file.name;
  
      //Use mv() to place file on server
      file.mv(filePath, async function (err) {
        if (err) {
          return res.status(500).json({ status: "error", message: err });
        }
      });
  
      const results = [];
  
      //Read csv file and update prices to database
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
          for (const product of results) {
            await Products.query()
              .findById(product.product_id)
              .patch({ updated_price: product.new_price });
          }
        });
  
      //Update prices to Shopify store using REST API
      //Find all products from database that have updated_price
      const products = await Products.query().whereNotNull('updated_price');
  
      //Loop through products and update prices to Shopify store
      for (const product of products) {
        //Modify product id to match Shopify product id format
        const productId = product.id.replace('gid://shopify/ProductVariant/', '');
  
        //Update product price to Shopify store
        await shopify.productVariant.update(productId, { price: product.updated_price });
      }
  
      return res.json({ status: "success", message: 'Price Updated!' });
    } catch (error) {
      console.log('Error updating prices:', error);
      res.status(500).json({ status: "error", message: error });
    }
  }
);

//Fetch products variants from Shopify store using GraphQL API. Use cursor for pagination.
async function fetchProductVariants(cursor = null) {
  const query = `
        query ($cursor: String) {
            productVariants(first: 50, after: $cursor) {
                pageInfo {
                    hasNextPage
                    endCursor
                }
                edges {
                    node {
                        id
                        title
                        price
                    }
                }
            }
        }
    `;

  try {
    //Fetch products from Shopify store
    const response = await shopify.graphql(query, { cursor });
  
    //Get products from response
    const products = response.productVariants.edges.map((edge) => {
      return {
        id: edge.node.id,
        title: edge.node.title,
        original_price: edge.node.price,
      };
    });
  
    const hasNextPage = response.productVariants.pageInfo.hasNextPage;
    const endCursor = response.productVariants.pageInfo.endCursor;
  
    return { products, hasNextPage, endCursor };
  } catch (error) {
    console.log('Error fetching products variant from Shopify:', error);
    throw error;
  }
}

//Fetch all products variants from Shopify store using GraphQL API. Add cursor pagination to query to fetch all products variants.
async function fetchAllProductVariants() {
  let allVariants = [];
  let hasNextPage = true;
  let cursor = null;

  try {
    while (hasNextPage) {
      const response = await fetchProductVariants(cursor);
      allVariants = allVariants.concat(response.products);
      hasNextPage = response.hasNextPage;
      cursor = response.endCursor;
    }
  
    return allVariants;
  } catch (error) {
    console.log('Error fetching all products variants from Shopify:', error);
    throw error;
  }
}

const port = 3000;

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

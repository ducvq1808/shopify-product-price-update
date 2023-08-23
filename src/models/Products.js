//Init Products model with objection
const { Model } = require('objection');

class Products extends Model {
    static get tableName() {
        return 'products';
    }
}

module.exports = Products;

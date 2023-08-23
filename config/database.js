const { Model } = require('objection');
const knex = require('knex');

const knexConfig = require('../knexfile');

const db = knex(knexConfig.development);

// Give the knex instance to objection.
Model.knex(db);

module.exports = db;

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const createConnection = opts => mongoose.createConnection(
  process.env.MONGODB_URI, { useMongoClient: true, ...opts }
);

module.exports = { mongoose, createConnection };

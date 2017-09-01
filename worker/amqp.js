const jackrabbit = require('jackrabbit');
const createExchange = () => jackrabbit(process.env.CLOUDAMQP_URL).default();
module.exports = createExchange;

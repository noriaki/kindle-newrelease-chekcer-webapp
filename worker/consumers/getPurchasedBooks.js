const jwt = require('jsonwebtoken');
const chunk = require('lodash.chunk');

const getPurchasedBooks = require('../../lib/amazon/getPurchasedBooks');
const User = require('../../db/models/user');
const cert = process.env.SECRET_KEY_BASE;

const exchange = require('../amqp')();
const key = 'books.detail.get';

const options = { name: 'books.purchased.get', durable: true };
const handler = ({ dataToken }, ack) => {
  (async () => {
    const { identifier, aid, apw } = jwt.verify(dataToken, cert);
    const user = await User.findOne({ identifier });
    const books = await getPurchasedBooks(aid, apw);
    await user.createBooksPurchased(books);
    chunk(books, 10).map((items) => {
      const asins = items.map(item => item.asin);
      // console.log('processing to [%s]... %s', key, asins.join());
      exchange.publish({ asins }, { key });
    });
    ack();
  })();
};

module.exports = { options, handler };

const getBooks = require('../../lib/amazon/getBooks');
const Book = require('../../db/models/book');
const exchange = require('../amqp')();

const options = { name: 'books.detail.get', durable: true };
const handler = ({ asins }, ack) => {
  (async () => {
    const details = await getBooks(asins);
    if (!details.error) {
      for (const asin of asins) {
        const book = await Book.findById(asin);
        const attributes = details[asin];
        if (attributes) {
          await book.set({
            ...attributes, active: true, processing: false,
          }).save();
        } else {
          await book.set({ disable: true, processing: false }).save();
        }
      }
      console.log(
        'Processed from [%s] %s..%s',
        options.name, asins[0], asins[asins.length - 1]
      );
    } else if (details.error === 'RequestThrottled') {
      console.log(
        'Retrying to [books.detail.get] %s..%s',
        asins[0], asins[asins.length - 1]
      );
      exchange.publish({ asins }, { key: 'books.detail.get' });
    }
    ack();
  })();
};

module.exports = { options, handler };

process.on('unhandledRejection', console.dir);

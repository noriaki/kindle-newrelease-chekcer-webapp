const Book = require('../../db/models/book');
const exchange = require('../amqp')();

const key = 'books.detail.get';

(async () => {
  let books = await Book.whereNeedsUpdate().exec();
  while (books != null && books.length > 0) {
    const asins = books.map(book => book.asin);
    console.log('processing to [%s]... %s', key, asins.join());
    await Book.updateMany({ asin: { '$in': asins } }, { processing: true });
    exchange.publish({ asins }, { key });
    books = await Book.whereNeedsUpdate().exec();
  }
})().then(() => process.exit(0));

process.on('unhandledRejection', (...errors) => {
  console.dir(...errors);
  process.exit(1);
});

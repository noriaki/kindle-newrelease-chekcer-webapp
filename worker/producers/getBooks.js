const Book = require('../../db/models/book');
const exchange = require('../amqp')();

const key = 'books.detail.get';

(async () => {
  while (await Book.whereNeedsUpdate().count() > 0) {
    const books = await Book.entriesNeedsUpdate().exec();
    const asins = books.map(book => book.id);
    console.log(
      'Processing to [%s] %s..%s',
      key, asins[0], asins[asins.length - 1]
    );
    await Book.updateMany({ _id: { '$in': asins } }, { processing: true });
    exchange.publish({ asins }, { key });
  }
})().then(() => process.exit(0));

process.on('unhandledRejection', (...errors) => {
  console.dir(...errors);
  process.exit(1);
});

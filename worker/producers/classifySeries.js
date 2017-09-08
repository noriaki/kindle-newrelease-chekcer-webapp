const classifySeries = require('../../lib/classifySeries');
const Book = require('../../db/models/book');
const Series = require('../../db/models/series');

// const exchange = require('../amqp')();
// const key = 'series.detail.get';

(async () => {
  const seriesIds = [];
  const bookCriteria = Book.where({ seriesId: undefined });
  while (await bookCriteria.count()) {
    const book = await bookCriteria.findOne();
    const { series } = await Series.firstOrCreate(classifySeries(book));
    await series
      .addAsinIfNotIncludes(book.id)
      .mergeAuthors(book.authors)
      .save();
    await book.set({ seriesId: series.id }).save();
    console.log('%s -* %s', series.id, book.id);
    if (!seriesIds.includes(series.id)) { seriesIds.push(series.id); }
  }
  console.log({ seriesIds });
})().then(() => process.exit(0));

process.on('unhandledRejection', (...errors) => {
  console.dir(...errors);
  process.exit(1);
});

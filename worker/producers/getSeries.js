const chunk = require('lodash.chunk');
const Book = require('../../db/models/book');
const Series = require('../../db/models/series');
const getSeriesLists = require('../../lib/amazon/getSeriesLists');
const getBooksOfSeries = require('../../lib/amazon/getBooksOfSeries');
const sleep = require('../../lib/utils/sleep');
const exchange = require('../amqp')();

const categories = getSeriesLists.categories;
const buildBooksListUrl = getBooksOfSeries.buildBooksListUrl;
const key = 'books.detail.get';

(async () => {
  const categoryIds = Object.keys(categories);
  for (const categoryId of categoryIds) {
    console.log('# %s (%s)', categories[categoryId], categoryId);
    const seriesList = await getSeriesLists(categoryId);
    for (const item of seriesList.items) {
      console.log('## %s', item.title);
      const { series } = await Series.firstOrCreate(
        { title: item.title },
        { title: item.title, listUrl: buildBooksListUrl(item.title) }
      );
      const asinList = await getBooksOfSeries(item.title);
      for (const asins of chunk(asinList, 10)) {
        for (const asin of asins) {
          await Book.firstOrCreateById(asin, { processing: true });
          await series.addAsinIfNotIncludes(asin).save();
        }
        exchange.publish({ asins }, { key });
        console.log(
          'Push queue to [%s] %s..%s (%d)',
          key, asins[0], asins[asins.length - 1], asins.length
        );
      }
    }
  }
  await sleep(1000);
})().then(() => process.exit(0));

process.on('unhandledRejection', (...errors) => {
  console.dir(...errors);
  process.exit(1);
});

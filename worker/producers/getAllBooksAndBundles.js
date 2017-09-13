const chunk = require('lodash.chunk');
const Book = require('../../db/models/book');
const Series = require('../../db/models/series');
const getBundleLists = require('../../lib/amazon/getBundleLists');
const getBooksOfBundle = require('../../lib/amazon/getBooksOfBundle');
const sleep = require('../../lib/utils/sleep');
const exchange = require('../amqp')();

const categories = getBundleLists.categories;

(async () => {
  const categoryIds = Object.keys(categories);
  for (const categoryId of categoryIds) {
    console.log('# %s (%s)', categories[categoryId], categoryId);
    const bundleList = await getBundleLists(categoryId);
    for (const bundleAsins of chunk(bundleList.asins, 10)) {
      for (const bundleAsin of bundleAsins) {
        console.log('## %s', bundleAsin);
        const { series } = await Series.firstOrCreateById(bundleAsin);
        const asinList = await getBooksOfBundle(bundleAsin);
        for (const asins of chunk(asinList, 10)) {
          for (const asin of asins) {
            await Book.firstOrCreateById(asin);
            await series.addAsinIfNotIncludes(asin).save();
          }
          publishQueue(asins, 'books.detail.get');
        }
      }
      publishQueue(bundleAsins, 'bundles.detail.get');
    }
  }
  await sleep(1000);
})().then(() => process.exit(0));

process.on('unhandledRejection', (...errors) => {
  console.dir(...errors);
  process.exit(1);
});

const publishQueue = (asins, key) => {
  exchange.publish({ asins }, { key });
  console.log(
    'Push to [%s] %s..%s (%d)',
    key, asins[0], asins[asins.length - 1], asins.length
  );
};

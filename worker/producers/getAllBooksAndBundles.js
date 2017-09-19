const chunk = require('lodash.chunk');
const Book = require('../../db/models/book');
const Series = require('../../db/models/series');
const promiseErrorHandler = require('../../lib/promiseErrorHandler');
const getCrawlerInstance = require('../../lib/crawler');
const getBundleLists = require('../../lib/amazon/getBundleLists');
const getBooksOfBundle = require('../../lib/amazon/getBooksOfBundle');
const sleep = require('../../lib/utils/sleep');
const exchange = require('../amqp')();

let categories = {};

const args = process.argv;
if (args.length === 2) {
  categories = getBundleLists.categories;
} else if (args.length === 3) {
  const arg = args[2];
  const cName = getBundleLists.categories[arg];
  if (!isNaN(arg) && cName) {
    categories = { [arg]: cName };
  }
}

(async () => {
  const categoryIds = Object.keys(categories);
  const crawler = await getCrawlerInstance({ debug: true });
  for (const categoryId of categoryIds) {
    console.log('# %s (%s)', categories[categoryId], categoryId);
    const bundleList = await getBundleLists(categoryId, crawler);
    const bundleAsinsList = bundleList.asins;
    for (const bundleAsins of chunk(bundleAsinsList, 10)) {
      console.log(
        '## %s..%s (page %d of %d)',
        bundleAsins[0], bundleAsins[bundleAsins.length - 1],
        bundleAsinsList.indexOf(bundleAsins[0]) / 10 + 1,
        bundleAsinsList.length / 10 + 1
      );
      for (const bundleAsin of bundleAsins) {
        const { series } = await Series.firstOrCreateById(bundleAsin);
        const asinList = await getBooksOfBundle(bundleAsin, crawler);
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
  crawler.finalize();
})().then(() => process.exit(0)).catch(promiseErrorHandler);

process.on('unhandledRejection', promiseErrorHandler);

const publishQueue = (asins, key) => {
  exchange.publish({ asins }, { key });
  console.log(
    'Push to [%s] %s..%s (%d)',
    key, asins[0], asins[asins.length - 1], asins.length
  );
};

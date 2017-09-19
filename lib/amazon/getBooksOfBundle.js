const getPageInstance = require('../crawler');

const getBooksOfBundle = async (bundleAsin, pageInstance) => {
  const page = pageInstance ? pageInstance : await getPageInstance();

  let asins = [];
  const bundleListUrl = buildBundleUrl(bundleAsin);
  await page.goto(bundleListUrl, { waitUntil: 'load' });
  asins = (await page.evaluate(booksAsinExtractor)).map(extractAsinReducer);
  const showAllLink = await page.$('#showAll a');
  if (showAllLink) {
    await showAllLink.click();
    await page.waitForFunction(selector => (
      document.querySelector(selector)
    ), {}, nextChildSelector(asins.length));
    asins = (await page.evaluate(booksAsinExtractor)).map(extractAsinReducer);
  }
  if (!pageInstance) { page.finally(); }
  return asins;
};
module.exports = getBooksOfBundle;

const booksAsinExtractor = () => [
  ...document.querySelectorAll('#series-childAsin-list a.book-details'),
].map(elm => elm.getAttribute('id'));

const extractAsinReducer = id => {
  const m = id.match(/^(\w+)_Detail_\d+$/);
  if (m && m.length === 2) { return m[1]; }
  return null;
};

const buildBundleUrl = asin => `https://www.amazon.co.jp/dp/${asin}`;

const nextChildSelector = size => [
  '#series-childAsin-list >',
  `.list-widget-row:nth-child(${size + 1})`,
  'a.book-details',
].join(' ');

getBooksOfBundle.buildBundleUrl = buildBundleUrl;

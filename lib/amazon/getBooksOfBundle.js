const puppeteer = require('puppeteer');

const getBooksOfBundle = async (bundleAsin) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'], headless: true, /* [DEBUG] headless: false */
  });
  const page = await browser.newPage();

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
  browser.close();
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

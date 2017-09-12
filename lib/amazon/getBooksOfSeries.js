const { URL, URLSearchParams } = require('url');
const puppeteer = require('puppeteer');

const getBooksOfSeries = async (seriesTitle) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
    headless: true, /* [DEBUG] headless: false */
  });
  const page = await browser.newPage();

  let pageNo = 1;
  let hasNextPageLink = true;
  let asins = [];
  while (hasNextPageLink) {
    const booksListUrl = buildBooksListUrl(seriesTitle, pageNo);
    await page.goto(booksListUrl, { waitUntil: 'load' });
    asins = [...asins, ...await page.evaluate(booksAsinExtractor)];
    hasNextPageLink = Boolean(await page.$('#pagnNextLink'));
    pageNo += 1;
  }
  browser.close();
  return asins;
};
module.exports = getBooksOfSeries;

const booksAsinExtractor = () => [
  ...document.querySelectorAll('.s-result-item'),
].map(li => li.getAttribute('data-asin'));

const buildBooksListUrl = (title, page = 1) => {
  const baseUrl = 'https://www.amazon.co.jp/s/';
  // Kindleストア, (Not) KindleカテゴリTOP / Kindle本 / コミック
  const ids = ['2250738051', '!2250739051', '2275256051', '2293143051'];
  const target = `p_lbr_books_series_browse-bin:${title}`;
  const params = {
    rh: ids.map(id => `n:${id}`).concat(target).join(),
    sort: 'date-desc-rank',
    lo: 'digital-text',
    page,
  };
  const url = new URL(baseUrl);
  url.search = new URLSearchParams(params);
  return url.toString();
};

getBooksOfSeries.buildBooksListUrl = buildBooksListUrl;

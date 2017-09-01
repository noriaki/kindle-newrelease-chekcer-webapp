const parseUrl = require('url').parse;
const URLSearchParams = require('url').URLSearchParams;
const dig = require('object-dig');
const puppeteer = require('puppeteer');

const getPurchasedBooks = async (aid, apw) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'], headless: false,
  });
  const page = await browser.newPage();
  const targetURL = 'https://www.amazon.co.jp/mn/dcw/myx.html/#/home/content/booksAll/dateDsc/';

  await visit(page, targetURL, { aid, apw });
  let pageIndex = 0;
  const items = [];
  const asins = [];
  let isFinish = false;
  let isSuccess = true;
  let hasMoreItems = true;
  let isReverse = false;
  while (isSuccess && hasMoreItems && !isFinish) {
    const result = await getAllBooksByAPI(page, pageIndex, isReverse);
    isSuccess = dig(result, 'OwnershipData', 'success');
    hasMoreItems = dig(result, 'OwnershipData', 'hasMoreItems');
    if (isSuccess) {
      const rets = dig(result, 'OwnershipData', 'items');
      for (const item of rets) {
        const asin = item.asin;
        if (!asins.includes(asin)) {
          items.push(item);
          asins.push(asin);
        } else {
          isFinish = true;
          break;
        }
      }
      pageIndex += 1;
    } else {
      const errorCode = dig(result, 'OwnershipData', 'error');
      if (errorCode === 'GENERIC_ERROR') {
        pageIndex = 0;
        isSuccess = hasMoreItems = isReverse = true;
      } else {
        console.error(`Error: ${errorCode}`);
      }
    }
  }
  return items;
};

module.exports = getPurchasedBooks;

const regexpLoginURL =
  /^https:\/\/www\.amazon\.co\.jp\/ap\/signin\?openid\.return_to=/;

const gotoAndWaitLoad = (page, url, options = {}) => (
  page.goto(url, { waitUntil: 'load', ...options })
);

const login = async (page, id, pw) => {
  if (!regexpLoginURL.test(await page.url())) { return; }
  await page.click('#ap_signin_existing_radio');
  await page.focus('#ap_email');
  await page.type(id);
  await page.focus('#ap_password');
  await page.type(pw);
  await page.click('#signInSubmit-input');
  await page.waitForNavigation({ timeout: 10001 });
};

const isLoggedIn = async (page) => {
  const isNotLoginUrl = !regexpLoginURL.test(await page.url());
  if (isNotLoginUrl) {
    const accountUrl = await page.evaluate(selector => {
      const elem = document.getElementById(selector);
      if (elem) { return elem.getAttribute('href'); }
      return false;
    }, 'nav-link-yourAccount');
    const regexpAccountURL = /^\/gp\/css\/homepage\.html/;
    return regexpAccountURL.test(parseUrl(accountUrl).pathname);
  }
  return false;
};

const visit = async (page, url, options = {}) => {
  const { aid, apw, ...opts } = options;
  if (url !== (await page.url())) {
    await gotoAndWaitLoad(page, url, opts);
  } else {
    return;
  }
  if (!await isLoggedIn(page)) {
    await login(page, aid, apw);
  }
  if (url !== (await page.url())) {
    await gotoAndWaitLoad(page, url, opts);
  }
};

const getAllBooksByAPI = async (page, pageNo = 0, reverse = false) => {
  const endpoint = '/mn/dcw/myx/ajax-activity/ref=myx_ajax';
  return await page.evaluate(async (endpoint, body) => {
    return await fetch(endpoint, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        client: 'MYX',
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }).then(res => res.json());
  }, endpoint, await buildBodyParams(page, pageNo, reverse));
};

const buildBodyParams = async (page, pageNo = 0, reverse = false) => {
  const batchSize = 100;
  const startIndex = pageNo * batchSize;
  const sortOrder = reverse ? 'ASCENDING' : 'DESCENDING';
  const csrfToken = await getCsrfToken(page);
  const data = {
    param: {
      OwnershipData: {
        contentType: 'Ebook',
        excludeExpiredItemsFor: [
          'KOLL',
          'Purchase',
          'Pottermore',
          'FreeTrial',
          'DeviceRegistration',
          'ku',
          'Sample',
          'Prime',
        ],
        isExtendedMYK: false,
        itemStatus: [ 'Active', 'Expired' ],
        originType: [
          'Purchase',
          'PublicLibraryLending',
          'PersonalLending',
          'KOLL',
          'RFFLending',
          'Pottermore',
          'Rental',
          'DeviceRegistration',
          'FreeTrial',
          'ku',
          'Sample',
          'Prime',
        ],
        sortIndex: 'DATE',
        sortOrder,
        batchSize,
        startIndex,
      },
    },
  };
  const ret = new URLSearchParams({ csrfToken, data: JSON.stringify(data) });
  return ret.toString();
};

// async function
const getCsrfToken = async (page) => {
  return await page.evaluate(() => window.csrfToken);
};

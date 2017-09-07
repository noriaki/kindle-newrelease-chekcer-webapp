const obtainUnicode = require('obtain-unicode').obtainUnicode;
const moji = require('moji');

const classifySeries = book => ({
  title: normalizeTitle(extractTitle(book.title)),
  author: extractAuthor(book.authors),
});

module.exports = classifySeries;

/*
 # \u2010-\u2015,\u2212 : some hyphens
 # \u4E0A : 上
 # \u4E2D : 中
 # \u4E0B : 下
 # \u5DFB : 巻
 */
const extractTitle = (title) => {
  const titleArray = obtainUnicode(title);
  const separater = /([\s\d０-９()<>"'.,\-[\]:;（）「」【】［］＜＞：；\u2010\u2011\u2012\u2013\u2014\u2015\u2212\u4E0A\u4E2D\u4E0B\u5DFB]|I|V){2,}/u;
  const threshold = 2;
  const m = title.match(separater);
  if (m) {
    if (m.index < threshold) {
      if (titleArray.length >= threshold) {
        const titleHead = title.slice(0, threshold);
        const titleTail = title.slice(threshold);
        return `${titleHead}${extractTitle(titleTail) || ''}`.trim();
      }
    } else {
      return String.fromCodePoint(...titleArray.slice(0, m.index));
    }
  }
  return title;
};
const extractAuthor = (authors) => authors[0];

const normalizeTitle = title => (
  moji(title)
    .convert('ZEtoHE')
    .convert('ZStoHS')
    .convert('HKtoZK')
    .toString()
);

classifySeries.extractTitle = extractTitle;
classifySeries.extractAuthor = extractAuthor;
classifySeries.normalizeTitle = normalizeTitle;

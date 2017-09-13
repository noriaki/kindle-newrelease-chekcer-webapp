const moji = require('moji');

const normalizeString = string => (
  moji(string)
    .convert('ZEtoHE')
    .convert('ZStoHS')
    .convert('HKtoZK')
    .toString()
);

const normalizeTitle = normalizeString;

const normalizeBundleTitle = title => (
  normalizeTitle(title).replace(/^\[まとめ買い\] /, '')
);

const normalizeAuthor = author => {
  const name = normalizeString(author);
  // if consists only of double-byte/blanks characters, remove blanks
  return (/^([^\x01-\x7E]|\s)+$/.test(name) ? name.replace(/\s+/g, '') : name);
};
const normalizeAuthors = authors => authors.map(normalizeAuthor);

const normalizeDescription = desc => desc.replace(/<br \/>/g, '');

module.exports = {
  normalizeTitle,
  normalizeBundleTitle,
  normalizeAuthor,
  normalizeAuthors,
  normalizeDescription,
};

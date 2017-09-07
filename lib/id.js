const shortid = require('shortid');
shortid.seed(process.env.SHORTID_SEED || 1192);
module.exports = () => {
  let id = shortid.generate();
  while (/^[-_].*[-_]$/.test(id)) { id = shortid.generate(); }
  return id;
};

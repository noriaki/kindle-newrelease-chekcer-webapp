const arrayify = (array) => {
  if (array == null) { return []; }
  return Array.isArray(array) ? array : [array];
}
module.exports = arrayify;

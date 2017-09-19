const promiseErrorHandler = (...errors) => {
  console.dir(...errors);
  process.exit(1);
};
module.exports = promiseErrorHandler;

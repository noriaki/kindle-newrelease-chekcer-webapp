const next = require('next');
const express = require('express');
const bodyParser = require('body-parser');
const bearerToken = require('express-bearer-token');
const api = require('./routes/api');

const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== 'production';
const nextServer = next({ dev });
const handle = nextServer.getRequestHandler();
const server = express();

const main = async () => {
  await nextServer.prepare();
  server.use(bodyParser.json());
  server.use(bearerToken({ bodyKey: 'token', queryKey: 'token' }));
  server.use('/api/v1', api);

  server.get('*', (req, res) => handle(req, res));

  server.listen(port, (err) => {
    if (err) { throw err; }
    console.log(`> Ready on http://localhost:${port}`);
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

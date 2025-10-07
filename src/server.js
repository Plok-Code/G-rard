const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const trelloRouter = require('./trello/router');

function rawBodySaver(req, _res, buf) {
  if (buf && buf.length) {
    req.rawBody = buf;
  }
}

function createServer() {
  const app = express();

  app.use(bodyParser.json({ verify: rawBodySaver }));
  app.use(bodyParser.urlencoded({ extended: false, verify: rawBodySaver }));

  app.get('/health', (_req, res) => {
    res.status(200).send('ok');
  });

  app.use('/webhooks/trello', trelloRouter);

  app.use((req, res) => {
    res.status(404).send('Not found');
  });

  return app;
}

function startHttpServer() {
  const app = createServer();
  const server = app.listen(config.server.port, () => {
    console.log(`[HTTP] Serveur demarre sur le port ${config.server.port}`);
  });
  return server;
}

module.exports = {
  createServer,
  startHttpServer,
};

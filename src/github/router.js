const express = require('express');
const util = require('util');
const config = require('../config');
const { sendActionMessage } = require('../discord/notifier');
const { isValidSignature } = require('./signature');
const { formatGithubEvent } = require('./formatter');

const router = express.Router();
const githubEnabled = Boolean(config.github.enabled && config.github.channelId);

router.head('/', (_req, res) => {
  res.status(200).send('OK');
});

router.get('/', (_req, res) => {
  res.status(200).send('OK');
});

router.post('/', async (req, res) => {
  if (!githubEnabled) {
    console.warn('[GitHub] Webhook recu mais integration desactivee');
    return res.status(503).send('GitHub integration disabled');
  }

  const signature = req.headers['x-hub-signature-256'];
  const eventName = req.headers['x-github-event'];
  const deliveryId = req.headers['x-github-delivery'];
  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});

  if (!isValidSignature(signature, rawBody)) {
    console.warn('[GitHub] Signature invalide', deliveryId);
    return res.status(401).send('Invalid signature');
  }

  if (!eventName) {
    console.log('[GitHub] Event sans nom', util.inspect(req.body, { depth: 1 }));
    return res.status(202).end();
  }

  try {
    const roleId = config.discord.githubPingRoleId || config.discord.pingRoleId;
    const roleMention = roleId ? `<@&${roleId}>` : '';
    const message = formatGithubEvent(eventName, req.body, roleMention);

    if (!message) {
      console.log('[GitHub] Event ignore', eventName, deliveryId);
      return res.status(202).end();
    }

    await sendActionMessage(message, { channelId: config.github.channelId });
    res.status(202).send('OK');
  } catch (error) {
    console.error('[GitHub] Erreur lors du traitement', eventName, error);
    res.status(500).send('Failed to process GitHub event');
  }
});

module.exports = router;

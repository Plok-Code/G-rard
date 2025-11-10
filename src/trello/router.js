const express = require('express');
const util = require('util');
const config = require('../config');
const { resolveDiscordProfile } = require('../config/userMap');
const { sendActionMessage } = require('../discord/notifier');
const { formatAction, shouldNotifyAction } = require('./formatter');
const { isValidSignature } = require('./signature');

const router = express.Router();

router.head('/', (_req, res) => {
  res.status(200).send('OK');
});

router.get('/', (_req, res) => {
  res.status(200).send('OK');
});

router.post('/', async (req, res) => {
  const rawBody = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body || {});
  const signature = req.headers['x-trello-webhook'];

  if (!isValidSignature(signature, rawBody)) {
    console.warn('[Trello] Signature invalide');
    return res.status(401).send('Invalid signature');
  }

  const action = req.body?.action;

  if (!action) {
    console.log('[Trello] Ping recu', util.inspect(req.body, { depth: 2, colors: false }));
    return res.status(200).send('OK');
  }

  if (!shouldNotifyAction(action)) {
    console.log('[Trello] Action ignoree (non notifiable)', action.type);
    return res.status(204).end();
  }

  try {
    const actor = action.memberCreator || {};
    const { discordUserId, displayName } = resolveDiscordProfile(actor);
    const actorDisplay = discordUserId
      ? `<@${discordUserId}>`
      : `**${displayName || actor.fullName || actor.username || 'Quelqu\'un'}**`;
    const roleMention = `<@&${config.discord.pingRoleId}>`;

    console.log('[Trello] Action recu', action.type, 'par', actor.fullName || actor.username || actor.id);

    const message = formatAction(action, actorDisplay, roleMention);
    await sendActionMessage(message);

    res.status(204).end();
  } catch (error) {
    console.error("[Trello] Erreur lors du traitement de l'action", error);
    res.status(500).send('Failed to process action');
  }
});

module.exports = router;

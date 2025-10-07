const { client } = require('./client');
const config = require('../config');

async function fetchChannel(channelId) {
  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    throw new Error(`Le salon Discord ${channelId} est introuvable ou n'est pas textuel`);
  }
  return channel;
}

async function sendActionMessage(message, options = {}) {
  const targetChannelId = options.channelId || config.discord.targetChannelId;
  const channel = await fetchChannel(targetChannelId);
  return channel.send(message);
}

module.exports = {
  fetchChannel,
  sendActionMessage,
};

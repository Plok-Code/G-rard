const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');
const config = require('../config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`[Discord] Connecte en tant que ${client.user.tag}`);
  if (config.discord.statusText) {
    client.user.setPresence({
      activities: [{ name: config.discord.statusText, type: ActivityType.Watching }],
      status: 'online',
    });
  }
});

async function startDiscord() {
  await client.login(config.discord.token);
}

module.exports = {
  client,
  startDiscord,
};

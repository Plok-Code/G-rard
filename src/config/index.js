const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function optionalEnv(name, fallback) {
  const value = process.env[name];
  return value !== undefined ? value : fallback;
}

function formatPrivateKey(key) {
  return key.replace(/\\n/g, '\n');
}

const driveEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const drivePrivateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
const driveChannelId = process.env.DISCORD_DRIVE_CHANNEL_ID;
const driveEnabled = Boolean(driveEmail && drivePrivateKey && driveChannelId);
const githubChannelId = optionalEnv('DISCORD_GITHUB_CHANNEL_ID', null);
const githubWebhookSecret = optionalEnv('GITHUB_WEBHOOK_SECRET', null);
const githubEnabled = Boolean(githubChannelId && githubWebhookSecret);

const config = {
  discord: {
    token: requireEnv('DISCORD_BOT_TOKEN'),
    targetChannelId: requireEnv('DISCORD_TARGET_CHANNEL_ID'),
    pingRoleId: requireEnv('DISCORD_PING_ROLE_ID'),
    driveChannelId: optionalEnv('DISCORD_DRIVE_CHANNEL_ID', null),
    drivePingRoleId: optionalEnv('DISCORD_DRIVE_PING_ROLE_ID', null),
    statusText: process.env.DISCORD_STATUS_TEXT || 'Listening for Trello & Drive updates',
  },
  trello: {
    callbackUrl: requireEnv('TRELLO_WEBHOOK_CALLBACK_URL'),
    verificationSecret: requireEnv('TRELLO_WEBHOOK_SECRET'),
  },
  drive: {
    enabled: driveEnabled,
    serviceAccountEmail: driveEnabled ? driveEmail : null,
    privateKey: driveEnabled ? formatPrivateKey(drivePrivateKey) : null,
    sharedDriveId: optionalEnv('GOOGLE_DRIVE_SHARED_DRIVE_ID', null),
    monitoredFolderId:
      optionalEnv('GOOGLE_DRIVE_FOLDER_ID', optionalEnv('GOOGLE_DRIVE_ID', null)),
    pollIntervalMs: parseInt(optionalEnv('GOOGLE_DRIVE_POLL_INTERVAL_MS', '15000'), 10),
    stateFile: optionalEnv('GOOGLE_DRIVE_STATE_FILE', path.join(process.cwd(), 'drive-state.json')),
  },
  github: {
    enabled: githubEnabled,
    channelId: githubChannelId,
    pingRoleId: optionalEnv('DISCORD_GITHUB_PING_ROLE_ID', null),
    webhookSecret: githubWebhookSecret,
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
};

module.exports = config;

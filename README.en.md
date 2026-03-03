# G-Rard - Trello / Drive / GitHub to Discord

Language: [Francais](README.md) | English (this file)

Node.js bot that sends Trello, Google Drive, and GitHub notifications to Discord channels.

Main goals:
- Ping a Discord role on important events (role mention is always at the end of the message, inside a spoiler).
- Show the event author using their Discord display name when a mapping exists.
- Fallback to the platform username when no mapping exists.

## 1. Prerequisites

- Node.js 18+ and npm
- A Discord server where you can add a bot
- A public HTTP endpoint (VPS, Docker, cloud, ngrok/cloudflared tunnel)
- Trello API key + Trello API secret + user token (to create the webhook)
- Optional for Drive: a Google Cloud project + service account
- Optional for GitHub: a repository with admin access to configure a webhook

## 2. Project setup

```bash
git clone https://github.com/Plok-Code/G-rard.git
cd G-rard
npm install
```

## 3. Create the Discord bot (full process)

1. Open https://discord.com/developers/applications
2. Click `New Application`, choose a name, then `Create`.
3. Go to `Bot`, click `Add Bot`.
4. In `Bot`, click `Reset Token` and copy the token:
- Put it in `.env` as `DISCORD_BOT_TOKEN`.
5. In `Bot`, check intents/permissions:
- `SERVER MEMBERS INTENT`: not required for this project.
- `MESSAGE CONTENT INTENT`: not required.
6. Go to `OAuth2` -> `URL Generator`:
- Scopes: `bot`
- Recommended bot permissions: `View Channels`, `Send Messages`, `Embed Links`, `Read Message History`, `Mention Everyone`
7. Open the generated URL and invite the bot to your server.
8. Enable Discord developer mode (User Settings -> Advanced -> Developer Mode).
9. Copy IDs:
- Trello channel ID -> `DISCORD_TARGET_CHANNEL_ID`
- Trello role ID (optional) -> `DISCORD_PING_ROLE_ID`
- Drive channel ID (optional) -> `DISCORD_DRIVE_CHANNEL_ID`
- Drive role ID (optional) -> `DISCORD_DRIVE_PING_ROLE_ID`
- GitHub channel ID (optional) -> `DISCORD_GITHUB_CHANNEL_ID`
- GitHub role ID (optional) -> `DISCORD_GITHUB_PING_ROLE_ID`

## 4. `.env` configuration

1. Copy the template:

```bash
cp .env.example .env
# PowerShell (Windows)
Copy-Item .env.example .env
```

2. Minimum required values:
- `DISCORD_BOT_TOKEN`
- `DISCORD_TARGET_CHANNEL_ID`
- `TRELLO_WEBHOOK_CALLBACK_URL`
- `TRELLO_WEBHOOK_SECRET`

3. Optional integrations:
- Drive is enabled only if `DISCORD_DRIVE_CHANNEL_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` are set.
- GitHub is enabled only if `DISCORD_GITHUB_CHANNEL_ID` and `GITHUB_WEBHOOK_SECRET` are set.

4. Ping options (true/false):
- Trello:
- `DISCORD_TRELLO_PING_ROLE_ENABLED` (default `true`)
- `DISCORD_TRELLO_PING_ACTOR_ENABLED` (default `true`)
- Drive:
- `DISCORD_DRIVE_PING_ROLE_ENABLED` (default `true`)
- `DISCORD_DRIVE_PING_ACTOR_ENABLED` (default `true`)
- GitHub:
- `DISCORD_GITHUB_PING_ROLE_ENABLED` (default `true`)
- `DISCORD_GITHUB_PING_ACTOR_ENABLED` (default `true`)
- Roles:
- `DISCORD_PING_ROLE_ID` = Trello role (and fallback for Drive/GitHub if specific role is missing)
- `DISCORD_DRIVE_PING_ROLE_ID` = specific Drive role (optional)
- `DISCORD_GITHUB_PING_ROLE_ID` = specific GitHub role (optional)

Examples:
- Disable Trello role ping: `DISCORD_TRELLO_PING_ROLE_ENABLED=false`
- Show actor name without mentioning the actor: set `*_PING_ACTOR_ENABLED=false`

## 5. Trello: create key/secret/token + webhook

### 5.1 Get Trello API key and API secret

1. Open https://trello.com/power-ups/admin
2. Create a Power-Up (or open an existing one).
3. Copy:
- `API Key`
- `API Secret`

Important:
- `TRELLO_WEBHOOK_SECRET` in `.env` must be your Trello `API Secret`.
- This secret is used to validate `x-trello-webhook` signatures.

### 5.2 Generate a Trello user token

Open this URL in your browser (replace `YOUR_KEY`):

```text
https://trello.com/1/authorize?expiration=never&name=G-Rard&scope=read,write&response_type=token&key=YOUR_KEY
```

Copy the returned token.

### 5.3 Get your Trello board ID

Option 1:
- Open the board and use Trello API calls to retrieve its `id`.

Option 2:
- Use your existing API tooling/curl scripts if you already have them.

### 5.4 Create the Trello webhook

`TRELLO_WEBHOOK_CALLBACK_URL` must be your public app URL + `/webhooks/trello`.

Webhook creation example:

```bash
curl -X POST "https://api.trello.com/1/webhooks/?key=YOUR_KEY&token=YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"callbackURL\":\"https://your-domain.com/webhooks/trello\",\"idModel\":\"BOARD_ID\",\"description\":\"G-Rard relay\"}"
```

## 6. Google Drive: complete setup

### 6.1 Create project and enable API

1. Open Google Cloud Console.
2. Create a project (or use an existing one).
3. Go to `APIs & Services` -> `Library`.
4. Enable `Google Drive API`.

### 6.2 Create service account + JSON key

1. Go to `IAM & Admin` -> `Service Accounts`.
2. Click `Create Service Account`.
3. Open that account -> `Keys` -> `Add Key` -> `Create new key` -> JSON.
4. From the JSON file:
- `client_email` -> `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` -> `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

In `.env`, keep newline escapes as `\n`:

```env
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 6.3 Grant access to monitored folder/drive

1. In Google Drive, share the target folder with the service account `client_email`.
2. Give at least `Viewer` permission (or higher if needed).

### 6.4 Choose monitoring scope

- `GOOGLE_DRIVE_FOLDER_ID`: root folder ID to monitor.
- `GOOGLE_DRIVE_SHARED_DRIVE_ID`: Shared Drive ID (if using shared drives).
- If `GOOGLE_DRIVE_FOLDER_ID` is empty, monitoring scope is broader based on your Drive config.

Notes:
- On first startup, the bot initializes the Drive token without replay-spamming old events.
- `drive-state.json` stores the current Drive cursor/state.

## 7. GitHub: complete setup

### 7.1 Generate secret

Generate a strong secret, for example:

```bash
openssl rand -hex 32
```

Set that value in `.env` as `GITHUB_WEBHOOK_SECRET`.

### 7.2 Create GitHub webhook

1. Open repository -> `Settings` -> `Webhooks` -> `Add webhook`.
2. Fill:
- `Payload URL`: `https://your-domain.com/webhooks/github`
- `Content type`: `application/json`
- `Secret`: same value as `GITHUB_WEBHOOK_SECRET`
3. Recommended events:
- `Pull requests`
- `Pushes`
- `Issue comments`
- `Pull request reviews`
- `Commit comments`
- `Delete`

## 8. User mapping (Discord name priority)

Mappings are defined in `src/config/userDirectory.js`.

Current behavior:
- If a mapping exists: the message shows `discordDisplayName`.
- Actor mention (`<@DISCORD_ID>`) happens only if `*_PING_ACTOR_ENABLED=true`.
- If no mapping exists: fallback to platform identity (Trello/Drive/GitHub).

Message formatting notes:
- When enabled, role mention is always appended at the end as spoiler: `||<@&ROLE_ID>||`.
- If role ping is disabled for one integration, no role mention is sent for that integration.

Minimal example:

```js
const userDirectory = [
  {
    discordUserId: '123456789012345678',
    discordDisplayName: 'Rard',
    trello: {
      memberId: 'abc123memberid',
      username: 'rard_trello',
      email: 'rard@example.com',
    },
    drive: {
      email: 'rard@example.com',
      displayName: 'Gerard R',
    },
    github: {
      usernames: ['plok-code', 'rard-dev'],
      emails: ['rard@example.com'],
      names: ['Gerard'],
    },
  },
];

module.exports = { userDirectory };
```

Practical tips:
- Add multiple GitHub aliases (`usernames`, `emails`, `names`) for reliable matching.
- For Trello and Drive, use as many identifiers as possible (ID + username + email).
- If you do not want actor mention, you can keep `discordDisplayName` and leave `discordUserId` empty.

## 9. Run locally

```bash
npm run start
```

Local healthcheck:

```bash
curl http://localhost:3000/health
```

## 10. Expose a public URL (local dev)

Example with ngrok:

```bash
ngrok http 3000
```

Then:
- Set ngrok HTTPS URL in `TRELLO_WEBHOOK_CALLBACK_URL` (`.../webhooks/trello`).
- Use the same base URL for GitHub (`.../webhooks/github`).
- Recreate/update Trello and GitHub webhooks if URL changes.

## 11. Hosting (production)

### Option A - Docker

Build and run:

```bash
docker build -t g-rard .
docker run -d --name g-rard --restart unless-stopped --env-file .env -p 3000:3000 g-rard
```

### Option B - VPS + PM2

```bash
npm install
npm install -g pm2
pm2 start src/index.js --name g-rard
pm2 save
pm2 startup
```

Production notes:
- Use a stable HTTPS URL (reverse proxy such as Nginx/Caddy is recommended).
- Keep `.env` secure.
- Back up `drive-state.json` if you redeploy often.

## 12. Validation checklist

1. Bot is online in Discord server.
2. `GET /health` returns `ok`.
3. Trello notifiable action sends a message.
4. Drive create/delete action reaches Drive channel.
5. GitHub push or PR sends a message.
6. Mapped users appear with Discord display names.
7. Unmapped users use platform fallback names.
8. Enabled role mention appears at the end of each message as spoiler.

## 13. Quick troubleshooting

- `Missing required environment variable ...`: a required variable is missing in `.env`.
- Trello `401 Invalid signature`: `TRELLO_WEBHOOK_SECRET` does not match Trello API secret.
- GitHub `401 Invalid signature`: `GITHUB_WEBHOOK_SECRET` does not match webhook secret in GitHub.
- Drive is silent: check folder/drive sharing for service account.
- Drive is silent: check `DISCORD_DRIVE_CHANNEL_ID` and Google credentials.
- Discord name not shown: check `src/config/userDirectory.js` mapping and `discordDisplayName`.

## 14. Useful files

- `.env.example`: all supported variables
- `src/config/userDirectory.js`: central user mapping
- `src/trello/router.js`: Trello webhook
- `src/drive/monitor.js`: Drive polling
- `src/github/router.js`: GitHub webhook

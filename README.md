# Trello, Drive and GitHub Discord Bot

Bridge between Trello / Google Drive / GitHub and Discord.
The bot posts formatted notifications and pings a target role for supported events.

## Prerequisites
- Node.js 18+ and npm
- A Discord bot created in the [Discord developer portal](https://discord.com/developers/applications)
- Trello developer access (key + app secret, user token)
- For Drive: a Google Cloud project with Drive API enabled and a service account
- A public HTTP endpoint (hosting, reverse proxy, tunnel like ngrok, etc.)

## Installation
```bash
npm install
```

## Configuration
1. Copy `.env.example` to `.env`.
2. Fill required environment variables for your own Discord/Trello/Drive/GitHub setup.
3. Optional user mentions:
   - `src/config/userMap.js` for Trello -> Discord
   - `src/config/driveUserMap.js` for Drive -> Discord
   - `src/config/githubUserMap.js` for GitHub -> Discord

By default, mapping files are templates and can stay empty.

### Discord variables
- `DISCORD_BOT_TOKEN`: Bot token
- `DISCORD_TARGET_CHANNEL_ID`: Target text channel for Trello notifications
- `DISCORD_PING_ROLE_ID`: Role ID to mention
- `DISCORD_DRIVE_CHANNEL_ID`: Target text channel for Drive notifications (optional)
- `DISCORD_DRIVE_PING_ROLE_ID`: Optional specific role for Drive (fallback to `DISCORD_PING_ROLE_ID`)
- `DISCORD_GITHUB_CHANNEL_ID`: Target text channel for GitHub notifications (optional)
- `DISCORD_GITHUB_PING_ROLE_ID`: Optional specific role for GitHub (fallback to `DISCORD_PING_ROLE_ID`)

### Trello variables
- `TRELLO_WEBHOOK_CALLBACK_URL`: Public webhook URL exposed to Trello (example: `https://example.com/webhooks/trello`)
- `TRELLO_WEBHOOK_SECRET`: Trello app secret used to verify `x-trello-webhook`

Create the Trello webhook:
```bash
curl -X POST \
  "https://api.trello.com/1/webhooks/?key=YOUR_KEY&token=USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackURL": "https://example.com/webhooks/trello",
    "idModel": "TRELLO_BOARD_ID",
    "description": "Discord relay"
  }'
```

### Google Drive variables
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` / `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
  - Create service account credentials in Google Cloud.
  - Share the monitored folder(s) with the service account.
  - Keep `\n` in the private key format.
- `GOOGLE_DRIVE_SHARED_DRIVE_ID`: Optional Shared Drive ID (leave empty for service account My Drive)
- `GOOGLE_DRIVE_FOLDER_ID`: Folder ID to monitor (subfolders included)
- `GOOGLE_DRIVE_POLL_INTERVAL_MS`: Polling interval (default `15000`)
- `GOOGLE_DRIVE_STATE_FILE`: Local state file path (default `drive-state.json`)

On first start, the bot initializes a Drive start token without sending historical events.

### GitHub variables
- `GITHUB_WEBHOOK_SECRET`: Shared secret to verify `x-hub-signature-256`
- Configure repository webhook:
  - Payload URL: `https://<your-domain>/webhooks/github`
  - Content type: `application/json`
  - Secret: `GITHUB_WEBHOOK_SECRET`
  - Events: at least `Pull requests`, `Pushes`, `Issue comments`, `Pull request reviews`, `Commit comments`, `Delete`

## Run
```bash
npm run start
```

The bot:
- connects to Discord
- serves Trello webhook at `/webhooks/trello`
- serves GitHub webhook at `/webhooks/github`
- monitors Drive changes continuously (if Drive variables are provided)

For local Trello testing, expose your local port with an HTTP tunnel (example: `ngrok http 3000`).

## Supported events
- Trello: important card actions (list moves, comments, attachments, member assignment, archive/restore)
- Google Drive: create and delete/trashed events
- GitHub: pull request, push, issue comment, pull request review, commit comment, delete

## Customization
- Trello formatting: `src/trello/formatter.js`
- Drive formatting: `src/drive/formatter.js`
- GitHub formatting: `src/github/formatter.js`
- Mention mappings: `src/config/*.js`

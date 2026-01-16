# Requirements

## Runtime
- Node.js 18+
- npm

## Required environment variables (Trello + Discord)
- DISCORD_BOT_TOKEN
- DISCORD_TARGET_CHANNEL_ID
- DISCORD_PING_ROLE_ID
- TRELLO_WEBHOOK_CALLBACK_URL
- TRELLO_WEBHOOK_SECRET

## Optional: Google Drive integration
- DISCORD_DRIVE_CHANNEL_ID
- GOOGLE_SERVICE_ACCOUNT_EMAIL
- GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
- GOOGLE_DRIVE_FOLDER_ID (optional; if empty, the whole Drive is monitored)
- GOOGLE_DRIVE_SHARED_DRIVE_ID (optional)
- DISCORD_DRIVE_PING_ROLE_ID (optional)

## Optional: GitHub integration
- DISCORD_GITHUB_CHANNEL_ID
- GITHUB_WEBHOOK_SECRET
- DISCORD_GITHUB_PING_ROLE_ID (optional)

## Hosting
- Public HTTPS endpoint for /webhooks/trello and /webhooks/github

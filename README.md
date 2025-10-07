# Trello & Drive Discord Bot

Bridge entre Trello / Google Drive et Discord qui ping le role cible a chaque action visible.

## Prerequis
- Node.js 18+ et npm
- Un bot Discord cree dans le [portal developpeur Discord](https://discord.com/developers/applications)
- Acces developpeur Trello (cle + secret, token utilisateur)
- Un projet Google Cloud avec l'API Drive active et un compte de service
- Un endpoint HTTP accessible publiquement (hebergement, tunnel ngrok, etc.)

## Installation
`ash
npm install
`

## Configuration generale
1. Copier le fichier .env.example en .env puis remplir les valeurs requises.
2. Completer les correspondances Trello -> Discord dans src/config/userMap.js si vous voulez mentionner les membres directement.
3. Completer les correspondances Google -> Discord dans src/config/driveUserMap.js pour mapper emails/noms vers les IDs Discord.

### Variables Discord
- DISCORD_BOT_TOKEN : token du bot
- DISCORD_TARGET_CHANNEL_ID : identifiant du salon texte pour Trello (1425147162936873132)
- DISCORD_PING_ROLE_ID : identifiant du role a ping (1425148129510035530)
- DISCORD_DRIVE_CHANNEL_ID : salon texte pour les notifications Google Drive (1425151598451097681)
- DISCORD_DRIVE_PING_ROLE_ID : optionnel, role specifique pour Drive (sinon le role Trello est reutilise)

### Trello
- TRELLO_WEBHOOK_CALLBACK_URL : URL publique exposee a Trello (ex: https://exemple.com/webhooks/trello)
- TRELLO_WEBHOOK_SECRET : secret (App Secret) Trello utilise pour verifier la signature x-trello-webhook

Creation du webhook :
`ash
curl -X POST \
  "https://api.trello.com/1/webhooks/?key=YOUR_KEY&token=USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackURL": "https://exemple.com/webhooks/trello",
    "idModel": "ID_DU_BOARD",
    "description": "Discord relay"
  }'
`

### Google Drive
- GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  - Creer un projet Google Cloud, activer l'API Drive, generer un compte de service et sa cle JSON.
  - Partager le(s) dossier(s) a surveiller avec le compte de service (role Lecteur ou plus).
  - Coller la cle privee dans .env en conservant les \n.
- GOOGLE_DRIVE_SHARED_DRIVE_ID : optionnel, ID d'un Drive partage (Shared Drive). Laisser vide pour surveiller "My Drive" du compte de service.
- GOOGLE_DRIVE_FOLDER_ID : ID du dossier racine a surveiller (les sous-dossiers sont inclus).
- GOOGLE_DRIVE_POLL_INTERVAL_MS : intervalle de polling (defaut 15000 ms).
- GOOGLE_DRIVE_UPDATE_COOLDOWN_MS : delai minimum (ms) entre deux notifications de mise a jour du meme fichier.
- GOOGLE_DRIVE_STATE_FILE : fichier local qui stocke le token de synchronisation (defaut drive-state.json).
- src/config/driveUserMap.js : mappez les emails (ou noms d'affichage) vers les IDs Discord pour mentionner automatiquement les membres.

> Au premier demarrage, le bot initialise un token Drive sans envoyer de notifications (sync initiale). Les changements suivants declencheront les pings.

## Lancement
`ash
npm run start
`
Le bot se connecte a Discord, sert les webhooks Trello sur /webhooks/trello, et surveille Google Drive en continu.

Pour un test local avec Trello, ouvrez un tunnel HTTP (ex: 
grok http 3000) et utilisez l'URL externe comme TRELLO_WEBHOOK_CALLBACK_URL.

## Fonctionnement
- Trello : chaque action recu via le webhook est verifiee via x-trello-webhook, mappee a un utilisateur Discord (si present dans userMap.js), puis publiee dans le salon Trello avec ping du role.
- Google Drive : le compte de service lit les changements (changes.list) et publie les ajouts, modifications, suppressions detectees dans le salon Drive, en pingant le role configure.
- Les fichiers de suivi (ex: drive-state.json) permettent de reprendre la surveillance sans perdre de changements.

## Aller plus loin
- Ajouter des cas specifiques dans src/trello/formatter.js ou src/drive/formatter.js pour personnaliser le resume des actions.
- Persister l'etat Drive ailleurs qu'en fichier (base de donnees, cache distribue).
- Exposer une commande Discord pour forcer une resynchronisation ou rafraichir les tokens.
- Deployer le bot sur une plateforme hebergee (VM, Docker, etc.) pour eviter de maintenir un tunnel.

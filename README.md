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
4. (Optionnel) Completer les correspondances GitHub -> Discord dans src/config/githubUserMap.js pour mentionner automatiquement les auteurs/acteurs lors des evenements GitHub.

## Liens utiles
- Trello equipe : https://trello.com/b/hEfZElfe/projet-2-wcd-equipe
- Dossier Drive surveille : https://drive.google.com/drive/folders/1d2nmZTXX5VQGaxkIVYNQIlWAVPrKM6_n?usp=drive_link

### Variables Discord
- DISCORD_BOT_TOKEN : token du bot
- DISCORD_TARGET_CHANNEL_ID : identifiant du salon texte pour Trello (1435620410665472050)
- DISCORD_PING_ROLE_ID : identifiant du role a ping (1435618024966062083)
- DISCORD_DRIVE_CHANNEL_ID : salon texte pour les notifications Google Drive (1435620509256646787)
- DISCORD_DRIVE_PING_ROLE_ID : optionnel, role specifique pour Drive (sinon le role Trello est reutilise)
- DISCORD_GITHUB_CHANNEL_ID : salon texte pour les notifications GitHub (1437462950582550729)
- DISCORD_GITHUB_PING_ROLE_ID : optionnel, role specifique pour GitHub (sinon le role Trello est reutilise)

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
- Trello : chaque action recu via le webhook est verifiee puis publiee uniquement si elle correspond a l'une des actions critiques (deplacement de carte entre listes, commentaire, piece jointe, assignation d'un membre, archivage). Les autres evenements sont ignores pour limiter le bruit.
- Google Drive : le compte de service lit les changements et ne publie qu'en cas de creation de fichier/dossier ou de suppression (mise a la corbeille ou suppression definitive). Les notifications partent des qu'un changement admissible est detecte (aucun delai de throttle). Les modifications de contenu restent ignorees car l'integration ne telecharge pas les fichiers pour rechercher des chaines specifique comme "Notif Discord".
- GitHub : le webhook `/webhooks/github` accepte les evenements Pull Request, Push, Issue Comment, Review, Commit Comment et Delete. Chaque evenement est verifie via la signature `x-hub-signature-256` avant publication dans le salon GitHub.
- Les fichiers de suivi (ex: drive-state.json) permettent de reprendre la surveillance sans perdre de changements.

## Aller plus loin
- Ajouter des cas specifiques dans src/trello/formatter.js ou src/drive/formatter.js pour personnaliser le resume des actions.
- Persister l'etat Drive ailleurs qu'en fichier (base de donnees, cache distribue).
- Exposer une commande Discord pour forcer une resynchronisation ou rafraichir les tokens.
- Deployer le bot sur une plateforme hebergee (VM, Docker, etc.) pour eviter de maintenir un tunnel.
- src/config/githubUserMap.js : mappez les emails/pseudos GitHub vers les IDs Discord si vous souhaitez des mentions directes (ex: `yannis.gaia@gmail.com` pour Yanis).

### GitHub
- DISCORD_GITHUB_CHANNEL_ID / DISCORD_GITHUB_PING_ROLE_ID pour cibler le salon Discord et le role mentionne.
- GITHUB_WEBHOOK_SECRET : secret partage pour verifier la signature `x-hub-signature-256`.
- Creez un webhook GitHub sur votre depot avec:
  - Payload URL : `https://<votre-domaine>/webhooks/github`
  - Content type : `application/json`
  - Secret : valeur de `GITHUB_WEBHOOK_SECRET`
  - Evenements : selectionnez au minimum `Pull requests`, `Pushes`, `Issue comments`, `Pull request reviews`, `Commit comments`, `Delete` (ou “Send me everything”).
- Chaque evenement supporte le mapping GitHub -> Discord via src/config/githubUserMap.js.

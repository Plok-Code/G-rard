# Trello & Drive Discord Bot

Bridge entre Trello / Google Drive / GitHub et Discord qui ping le role cible a chaque action visible.

## Prerequis
- Node.js 18+ et npm
- Un bot Discord cree dans le [portal developpeur Discord](https://discord.com/developers/applications)
- Acces developpeur Trello (cle + secret, token utilisateur)
- Un endpoint HTTP accessible publiquement (hebergement, tunnel ngrok, etc.)
- (Optionnel) Un projet Google Cloud avec l'API Drive active et un compte de service
- (Optionnel) Un depot GitHub avec un webhook configure

## Installation
```bash
npm install
```

## Demarrage rapide (ordre)
1. Installer les dependances : `npm install`
2. Copier le fichier `.env.example` en `.env`
3. Remplir les variables minimales :
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_TARGET_CHANNEL_ID`
   - `DISCORD_PING_ROLE_ID`
   - `TRELLO_WEBHOOK_CALLBACK_URL`
   - `TRELLO_WEBHOOK_SECRET`
4. Lancer ou deployer le bot : `npm run start` (URL publique requise pour Trello)
5. Creer le webhook Trello vers `https://<votre-domaine>/webhooks/trello`
6. (Optionnel) Activer Drive : remplir les variables Drive + partager le dossier avec le compte de service
7. (Optionnel) Activer GitHub : remplir les variables GitHub + creer le webhook sur `/webhooks/github`
8. (Optionnel) Mapper les utilisateurs si vous voulez des mentions directes :
   - Remplir `src/config/userDirectory.js` (tableau unique Discord <-> Trello/Drive/GitHub)

Si vous laissez ces fichiers vides, le bot mentionne uniquement le role configure.
Si vous laissez les champs Drive/GitHub vides dans `.env`, les integrations correspondantes sont desactivees.

### Variables Discord
- DISCORD_BOT_TOKEN : token du bot
- DISCORD_TARGET_CHANNEL_ID : identifiant du salon texte pour Trello
- DISCORD_PING_ROLE_ID : identifiant du role a ping
- DISCORD_DRIVE_CHANNEL_ID : optionnel, active Drive
- DISCORD_DRIVE_PING_ROLE_ID : optionnel, role specifique pour Drive (sinon reutilise le role Trello)
- DISCORD_GITHUB_CHANNEL_ID : optionnel, active GitHub
- DISCORD_GITHUB_PING_ROLE_ID : optionnel, role specifique pour GitHub (sinon reutilise le role Trello)
- DISCORD_STATUS_TEXT : optionnel, message de statut du bot

### Trello
- TRELLO_WEBHOOK_CALLBACK_URL : URL publique exposee a Trello (ex: https://exemple.com/webhooks/trello)
- TRELLO_WEBHOOK_SECRET : secret (App Secret) Trello utilise pour verifier la signature x-trello-webhook

Creation du webhook :
```bash
curl -X POST \
  "https://api.trello.com/1/webhooks/?key=YOUR_KEY&token=USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "callbackURL": "https://exemple.com/webhooks/trello",
    "idModel": "ID_DU_BOARD",
    "description": "Discord relay"
  }'
```

### Google Drive
- GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  - Creer un projet Google Cloud, activer l'API Drive, generer un compte de service et sa cle JSON.
  - Partager le(s) dossier(s) a surveiller avec le compte de service (role Lecteur ou plus).
  - Coller la cle privee dans .env en conservant les \n.
- GOOGLE_DRIVE_SHARED_DRIVE_ID : optionnel, ID d'un Drive partage (Shared Drive).
- GOOGLE_DRIVE_FOLDER_ID : optionnel, ID du dossier racine a surveiller (sinon tout le Drive est surveille).
- GOOGLE_DRIVE_POLL_INTERVAL_MS : intervalle de polling (defaut 15000 ms).
- GOOGLE_DRIVE_STATE_FILE : fichier local qui stocke le token de synchronisation (defaut drive-state.json).

> Au premier demarrage, le bot initialise un token Drive sans envoyer de notifications (sync initiale). Les changements suivants declencheront les pings.

### GitHub
- DISCORD_GITHUB_CHANNEL_ID / DISCORD_GITHUB_PING_ROLE_ID pour cibler le salon Discord et le role mentionne.
- GITHUB_WEBHOOK_SECRET : secret partage pour verifier la signature `x-hub-signature-256`.
- Creez un webhook GitHub sur votre depot avec:
  - Payload URL : `https://<votre-domaine>/webhooks/github`
  - Content type : `application/json`
  - Secret : valeur de `GITHUB_WEBHOOK_SECRET`
  - Evenements : selectionnez au minimum `Pull requests`, `Pushes`, `Issue comments`, `Pull request reviews`, `Commit comments`, `Delete` (ou "Send me everything").

## Lancement
```bash
npm run start
```
Le bot se connecte a Discord, sert les webhooks Trello sur `/webhooks/trello`, les webhooks GitHub sur `/webhooks/github`, et surveille Google Drive en continu (si active).

Pour un test local avec Trello, ouvrez un tunnel HTTP (ex: `ngrok http 3000`) et utilisez l'URL externe comme `TRELLO_WEBHOOK_CALLBACK_URL`.

## Fonctionnement
- Trello : chaque action recu via le webhook est verifiee puis publiee uniquement si elle correspond a l'une des actions critiques (deplacement de carte entre listes, commentaire, piece jointe, assignation d'un membre, archivage). Les autres evenements sont ignores pour limiter le bruit.
- Google Drive : le compte de service lit les changements et ne publie qu'en cas de creation de fichier/dossier ou de suppression (mise a la corbeille ou suppression definitive). Les notifications partent des qu'un changement admissible est detecte (aucun delai de throttle). Les modifications de contenu restent ignorees car l'integration ne telecharge pas les fichiers pour rechercher des chaines specifique comme "Notif Discord".
- GitHub : le webhook `/webhooks/github` accepte les evenements Pull Request, Push, Issue Comment, Review, Commit Comment et Delete. Chaque evenement est verifie via la signature `x-hub-signature-256` avant publication dans le salon GitHub.
- Les fichiers de suivi (ex: drive-state.json) permettent de reprendre la surveillance sans perdre de changements.

## Aller plus loin
- Ajouter des cas specifiques dans `src/trello/formatter.js` ou `src/drive/formatter.js` pour personnaliser le resume des actions.
- Persister l'etat Drive ailleurs qu'en fichier (base de donnees, cache distribue).
- Exposer une commande Discord pour forcer une resynchronisation ou rafraichir les tokens.
- Deployer le bot sur une plateforme hebergee (VM, Docker, etc.) pour eviter de maintenir un tunnel.
- Mapper les utilisateurs dans `src/config/userDirectory.js` si vous souhaitez des mentions directes.

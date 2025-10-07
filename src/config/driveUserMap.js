// Map Google accounts (email/displayName) to Discord user IDs for Drive notifications.
// Renseignez les emails exacts (ou noms d'affichage) correspondant a vos membres.
const driveUserMappings = [
  {
    email: 'idris.naulleau.aurial@gmail.com',
    displayName: 'Idris Naulleau',
    discordUserId: '929471016776904724',
  },
  {
    email: 'vanessa.autale@gmail.com',
    displayName: 'Vanessa Autale',
    discordUserId: '1381308848962408479',
  },
  {
    email: 'audreyreboutier@gmail.com',
    displayName: 'Audrey Reboutier',
    discordUserId: '1419213516866457613',
  },
  {
    email: 'rayanouhaud@gmail.com',
    displayName: 'Rayan Nouhaud',
    discordUserId: '442583182735572992',
  },
];

function normalise(value) {
  return (value || '').trim().toLowerCase();
}

function resolveDriveDiscordUser(actor) {
  if (!actor) {
    return null;
  }

  const email = actor.emailAddress;
  const displayName = actor.displayName;

  const match = driveUserMappings.find((entry) => {
    if (entry.email && normalise(entry.email) === normalise(email)) {
      return true;
    }
    if (entry.displayName && normalise(entry.displayName) === normalise(displayName)) {
      return true;
    }
    return false;
  });

  return match ? match.discordUserId : null;
}

module.exports = {
  driveUserMappings,
  resolveDriveDiscordUser,
};

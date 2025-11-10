// Map Google accounts (email/displayName) to Discord user IDs for Drive notifications.
// Renseignez les emails exacts (ou noms d'affichage) correspondant a vos membres.
const driveUserMappings = [
  {
    email: 'idris.naulleau.aurial@gmail.com',
    displayName: 'Idris Naulleau',
    discordUserId: '929471016776904724',
  },
  {
    email: 'amelie.ny.tran@gmail.com',
    displayName: 'Amelie Tran',
    discordUserId: '405044561052696577',
  },
  {
    email: 'ericmongreville1@gmail.com',
    displayName: 'Eric Mongreville',
    discordUserId: '1418256477147369595',
  },
  {
    email: 'yannis.gris@gmail.com',
    displayName: 'Yanis Gris',
    discordUserId: '394803260764192770',
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

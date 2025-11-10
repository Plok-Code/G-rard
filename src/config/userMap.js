// Map Trello members to Discord user IDs so the bot can mention them.
// Fill this array with the Trello member identifiers you want to match.
const userMappings = [
  {
    trelloMemberId: '671bcf458f2e724ae3ff9f27',
    trelloFullName: 'Nova Realm',
    trelloEmail: 'idris.naulleau.aurial@gmail.com',
    preferredDisplayName: 'Idris Naulleau-Aurial',
    discordUserId: '929471016776904724',
  },
  {
    trelloFullName: 'Amelie Tran',
    trelloEmail: 'amelie.ny.tran@gmail.com',
    discordUserId: '405044561052696577',
  },
  {
    trelloFullName: 'Eric Mongreville',
    trelloEmail: 'ericmongreville1@gmail.com',
    discordUserId: '1418256477147369595',
  },
  {
    trelloFullName: 'Yanis Gris',
    trelloEmail: 'yannis.gris@gmail.com',
    discordUserId: '394803260764192770',
  },
];

function normalise(value) {
  return (value || '').trim().toLowerCase();
}

function findMapping(member) {
  if (!member) {
    return null;
  }

  const { id, username, fullName, email } = member;

  const match = userMappings.find((entry) => {
    if (entry.trelloMemberId && entry.trelloMemberId === id) {
      return true;
    }
    if (entry.trelloUsername && normalise(entry.trelloUsername) === normalise(username)) {
      return true;
    }
    if (entry.trelloFullName && normalise(entry.trelloFullName) === normalise(fullName)) {
      return true;
    }
    if (entry.trelloEmail && normalise(entry.trelloEmail) === normalise(email)) {
      return true;
    }
    return false;
  });

  return match || null;
}

function resolveDiscordUser(member) {
  const match = findMapping(member);
  return match ? match.discordUserId || null : null;
}

function resolveDiscordProfile(member) {
  const match = findMapping(member);
  if (!match) {
    return { discordUserId: null, displayName: null };
  }

  const displayName =
    match.preferredDisplayName ||
    match.discordDisplayName ||
    match.trelloFullName ||
    match.trelloUsername ||
    null;

  return {
    discordUserId: match.discordUserId || null,
    displayName,
  };
}

module.exports = {
  resolveDiscordUser,
  resolveDiscordProfile,
  userMappings,
};

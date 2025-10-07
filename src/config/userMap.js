// Map Trello members to Discord user IDs so the bot can mention them.
// Fill this array with the Trello member identifiers you want to match.
const userMappings = [
  {
    trelloMemberId: '671bcf458f2e724ae3ff9f27',
    trelloUsername: 'novarealm',
    trelloFullName: 'Nova Realm',
    discordUserId: '929471016776904724',
  },
  {
    trelloMemberId: '68e52e31de094775a7aff96a',
    trelloUsername: 'vanessaautale',
    trelloFullName: 'Vanessa Autale',
    discordUserId: '1381308848962408479',
  },
  {
    trelloMemberId: '68e52de7529079f5ea8b7500',
    trelloUsername: 'audreyreboutier',
    trelloFullName: 'Audrey Reboutier',
    discordUserId: '1419213516866457613',
  },
  {
    trelloMemberId: '68e52ceb9f25b011fd9d578d',
    trelloUsername: 'rayannouhaud',
    trelloFullName: 'Rayan Nouhaud',
    discordUserId: '442583182735572992',
  },
];

function normalise(value) {
  return (value || '').trim().toLowerCase();
}

function resolveDiscordUser(member) {
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

  return match ? match.discordUserId : null;
}

module.exports = {
  resolveDiscordUser,
  userMappings,
};

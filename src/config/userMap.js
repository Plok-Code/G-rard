// Map Trello members to Discord user IDs so the bot can mention them.
// Add entries matching your own ecosystem. Keep empty to disable direct user mentions.
const userMappings = [
  // Example:
  // {
  //   trelloMemberId: 'trello_member_id',
  //   trelloUsername: 'trello_username',
  //   trelloFullName: 'Full Name',
  //   trelloEmail: 'user@example.com',
  //   preferredDisplayName: 'Display Name',
  //   discordUserId: '123456789012345678',
  // },
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

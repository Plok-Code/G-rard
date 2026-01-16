const { userDirectory } = require('./userDirectory');

// Map Trello members to Discord user IDs so the bot can mention them.
// Populate src/config/userDirectory.js instead of editing this file directly.
const userMappings = userDirectory
  .map((entry) => {
    const trello = entry?.trello;
    if (!trello) {
      return null;
    }

    return {
      trelloMemberId: trello.memberId,
      trelloUsername: trello.username,
      trelloFullName: trello.fullName,
      trelloEmail: trello.email,
      preferredDisplayName: trello.preferredDisplayName || entry.discordDisplayName,
      discordDisplayName: entry.discordDisplayName,
      discordUserId: entry.discordUserId,
    };
  })
  .filter((entry) => {
    if (!entry) {
      return false;
    }
    return Boolean(
      entry.trelloMemberId || entry.trelloUsername || entry.trelloFullName || entry.trelloEmail,
    );
  });

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

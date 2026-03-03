const { userDirectory } = require('./userDirectory');

// Map Google accounts (email/displayName) to Discord user IDs for Drive notifications.
// Populate src/config/userDirectory.js instead of editing this file directly.
const driveUserMappings = userDirectory
  .map((entry) => {
    const drive = entry?.drive;
    if (!drive) {
      return null;
    }

    return {
      email: drive.email,
      displayName: drive.displayName,
      discordDisplayName: entry.discordDisplayName,
      discordUserId: entry.discordUserId,
    };
  })
  .filter((entry) => {
    if (!entry) {
      return false;
    }
    return Boolean(entry.email || entry.displayName);
  });

function normalise(value) {
  return (value || '').trim().toLowerCase();
}

function resolveDriveDiscordUser(actor) {
  const profile = resolveDriveDiscordProfile(actor);
  return profile.discordUserId;
}

function resolveDriveDiscordProfile(actor) {
  if (!actor) {
    return { discordUserId: null, displayName: null };
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

  if (!match) {
    return { discordUserId: null, displayName: null };
  }

  return {
    discordUserId: match.discordUserId || null,
    displayName: match.discordDisplayName || null,
  };
}

module.exports = {
  driveUserMappings,
  resolveDriveDiscordProfile,
  resolveDriveDiscordUser,
};

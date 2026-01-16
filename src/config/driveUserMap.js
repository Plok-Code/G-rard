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

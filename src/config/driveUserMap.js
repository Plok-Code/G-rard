// Map Google accounts (email/displayName) to Discord user IDs for Drive notifications.
// Add entries matching your own ecosystem. Keep empty to disable direct user mentions.
const driveUserMappings = [
  // Example:
  // {
  //   email: 'user@example.com',
  //   displayName: 'Full Name',
  //   discordUserId: '123456789012345678',
  // },
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

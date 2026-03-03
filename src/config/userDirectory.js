// Single source of truth to map Discord users to Trello/Drive/GitHub identities.
// Fill this table once; the service-specific maps will read from it.
const userDirectory = [
  // {
  //   // Discord user ID (Developer mode -> Copy User ID). Optional but recommended for mentions.
  //   discordUserId: 'DISCORD_USER_ID',
  //   // Discord nickname/display name to show in notifications when a mapping is found.
  //   discordDisplayName: 'Pseudo Discord',
  //   trello: {
  //     // At least one of these fields is required for Trello matching.
  //     memberId: 'TRELLO_MEMBER_ID',
  //     username: 'trello_username',
  //     fullName: 'Full Name',
  //     email: 'user@example.com',
  //     // Optional override label used only if discordDisplayName is missing.
  //     preferredDisplayName: 'Pseudo Trello en secours',
  //   },
  //   drive: {
  //     // At least one of these fields is required for Drive matching.
  //     email: 'user@example.com',
  //     displayName: 'Full Name',
  //   },
  //   github: {
  //     // Add every alias that can appear in GitHub events.
  //     emails: ['user@example.com'],
  //     usernames: ['github_username'],
  //     names: ['Full Name'],
  //     // Optional override label used only if discordDisplayName is missing.
  //     displayName: 'Pseudo GitHub en secours',
  //   },
  // },
];

module.exports = {
  userDirectory,
};

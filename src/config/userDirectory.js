// Single source of truth to map Discord users to Trello/Drive/GitHub identities.
// Fill this table once; the service-specific maps will read from it.
const userDirectory = [
  // {
  //   discordUserId: 'DISCORD_USER_ID',
  //   discordDisplayName: 'Full Name',
  //   trello: {
  //     memberId: 'TRELLO_MEMBER_ID',
  //     username: 'trello_username',
  //     fullName: 'Full Name',
  //     email: 'user@example.com',
  //     preferredDisplayName: 'Preferred display name',
  //   },
  //   drive: {
  //     email: 'user@example.com',
  //     displayName: 'Full Name',
  //   },
  //   github: {
  //     emails: ['user@example.com'],
  //     usernames: ['github_username'],
  //     names: ['Full Name'],
  //     displayName: 'Full Name',
  //   },
  // },
];

module.exports = {
  userDirectory,
};

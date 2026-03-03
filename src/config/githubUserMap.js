// Map GitHub actors (emails / usernames / names) to Discord mentions.
// Add entries matching your own ecosystem. Keep empty to disable direct user mentions.
const githubUserMappings = [
  // Example:
  // {
  //   usernames: ['github-login'],
  //   emails: ['user@example.com'],
  //   names: ['Full Name'],
  //   displayName: 'Display Name',
  //   discordUserId: '123456789012345678',
  // },
];

function normalise(value) {
  return (value || '').trim().toLowerCase();
}

function matchesEntry(entry, actor) {
  const login = normalise(actor?.login);
  const username = normalise(actor?.username);
  const name = normalise(actor?.name);
  const email = normalise(actor?.email);

  if (entry.usernames) {
    const hit = entry.usernames
      .map(normalise)
      .some((val) => val && (val === login || val === username));
    if (hit) {
      return true;
    }
  }

  if (entry.emails) {
    const hit = entry.emails.map(normalise).some((val) => val && val === email);
    if (hit) {
      return true;
    }
  }

  if (entry.names) {
    const hit = entry.names.map(normalise).some((val) => val && val === name);
    if (hit) {
      return true;
    }
  }

  return false;
}

function resolveGithubDiscordUser(actor) {
  if (!actor) {
    return { discordUserId: null, displayName: null };
  }

  const match = githubUserMappings.find((entry) => matchesEntry(entry, actor));

  if (!match) {
    return { discordUserId: null, displayName: null };
  }

  return {
    discordUserId: match.discordUserId || null,
    displayName: match.displayName || null,
  };
}

module.exports = {
  githubUserMappings,
  resolveGithubDiscordUser,
};

const { userDirectory } = require('./userDirectory');

// Map GitHub actors (emails / usernames) to Discord mentions so GitHub events can tag the team.
// Populate src/config/userDirectory.js instead of editing this file directly.
const githubUserMappings = userDirectory
  .map((entry) => {
    const github = entry?.github;
    if (!github) {
      return null;
    }

    return {
      emails: github.emails,
      usernames: github.usernames,
      names: github.names,
      displayName: github.displayName || entry.discordDisplayName,
      discordUserId: entry.discordUserId,
    };
  })
  .filter((entry) => {
    if (!entry) {
      return false;
    }

    const hasEmails = Array.isArray(entry.emails) && entry.emails.length > 0;
    const hasUsernames = Array.isArray(entry.usernames) && entry.usernames.length > 0;
    const hasNames = Array.isArray(entry.names) && entry.names.length > 0;
    return hasEmails || hasUsernames || hasNames;
  });

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

// Map GitHub actors (emails / usernames) to Discord mentions so GitHub events can tag the team.
const githubUserMappings = [
  {
    emails: ['idris.naulleau.aurial@gmail.com'],
    displayName: 'Idris Naulleau-Aurial',
    discordUserId: '929471016776904724',
  },
  {
    emails: ['amelie.ny.tran@gmail.com'],
    displayName: 'Amelie Ny Tran',
    discordUserId: '405044561052696577',
  },
  {
    emails: ['ericmongreville1@gmail.com'],
    displayName: 'Eric Mongreville',
    discordUserId: '1418256477147369595',
  },
  {
    emails: ['yannis.gris@gmail.com', 'yannis.gaia@gmail.com'],
    displayName: 'Yanis Gris',
    discordUserId: '394803260764192770',
  },
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

const { resolveDriveDiscordUser } = require('../config/driveUserMap');

function humanMimeType(mimeType = '') {
  if (mimeType === 'application/vnd.google-apps.folder') {
    return 'Dossier';
  }
  if (mimeType.startsWith('application/vnd.google-apps.')) {
    return mimeType.replace('application/vnd.google-apps.', '').replace(/_/g, ' ');
  }
  if (mimeType.startsWith('image/')) {
    return 'Image';
  }
  if (mimeType.startsWith('video/')) {
    return 'Video';
  }
  if (mimeType.startsWith('audio/')) {
    return 'Audio';
  }
  if (mimeType.startsWith('text/')) {
    return 'Document texte';
  }
  return 'Fichier';
}

function buildFileLink(file) {
  if (!file) {
    return 'un element';
  }
  const name = file.name || 'un element';
  if (file.webViewLink) {
    return `[${name}](${file.webViewLink})`;
  }
  return `"${name}"`;
}

function buildActor(file) {
  const actor = file?.lastModifyingUser || file?.owners?.[0];
  const displayName = actor?.displayName || actor?.emailAddress || 'Quelqu\'un';
  const email = actor?.emailAddress;
  const discordUserId = resolveDriveDiscordUser(actor);

  const mention = discordUserId ? `<@${discordUserId}>` : `**${displayName}**`;
  const embedLabel = email ? `${displayName} (${email})` : displayName;

  return {
    mention,
    embedLabel,
    raw: actor,
  };
}

function isCreation(file) {
  if (!file?.createdTime || !file?.modifiedTime) {
    return false;
  }
  return Math.abs(new Date(file.modifiedTime).getTime() - new Date(file.createdTime).getTime()) < 5000;
}

function describeChange(change, actorLabel, fileLink) {
  if (change.removed) {
    return {
      contentSummary: `a supprime definitivement ${fileLink}.`,
      embedSummary: `${actorLabel} a supprime definitivement ${fileLink}.`,
      details: 'Suppression definitive',
    };
  }

  if (change.file?.trashed) {
    return {
      contentSummary: `a place ${fileLink} dans la corbeille.`,
      embedSummary: `${actorLabel} a place ${fileLink} dans la corbeille.`,
      details: 'Element dans la corbeille',
    };
  }

  if (isCreation(change.file)) {
    return {
      contentSummary: `a ajoute ${fileLink}.`,
      embedSummary: `${actorLabel} a ajoute ${fileLink}.`,
      details: 'Nouvel element',
    };
  }

  return {
    contentSummary: `a modifie ${fileLink}.`,
    embedSummary: `${actorLabel} a modifie ${fileLink}.`,
    details: 'Mise a jour',
  };
}

function formatChange(change, roleMention) {
  const file = change.file;
  const actor = buildActor(file);
  const fileLink = buildFileLink(file);
  const summary = describeChange(change, actor.embedLabel, fileLink);

  const contentParts = [roleMention, actor.mention, summary.contentSummary].filter(Boolean);
  const content = contentParts.join(' ').trim();

  const embed = {
    color: 0x2ecc71,
    title: file?.name || 'Element Google Drive',
    url: file?.webViewLink,
    description: summary.embedSummary,
    timestamp: file?.modifiedTime || new Date().toISOString(),
    footer: { text: `Change Google Drive - ${change.fileId}` },
    fields: [
      { name: 'Acteur', value: actor.embedLabel, inline: true },
      { name: 'Action', value: summary.details, inline: true },
      { name: 'Type', value: humanMimeType(file?.mimeType), inline: true },
    ].filter((field) => field.value),
  };

  return { content, embeds: [embed] };
}

module.exports = {
  formatChange,
};

const { resolveDriveDiscordProfile } = require('../config/driveUserMap');

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

function buildActor(file, options = {}) {
  const { mentionActor = true } = options;
  const actor = file?.lastModifyingUser || file?.owners?.[0];
  const mapping = resolveDriveDiscordProfile(actor);
  const fallbackLabel = actor?.displayName || actor?.emailAddress || 'Quelqu\'un';
  const displayName = mapping.displayName || fallbackLabel;
  const discordUserId = mapping.discordUserId;

  const mention = mentionActor && discordUserId ? `<@${discordUserId}>` : `**${displayName}**`;
  const embedLabel = displayName;

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

function formatChange(change, roleMention, options = {}) {
  const file = change.file;
  const actor = buildActor(file, options);
  const fileLink = buildFileLink(file);
  const summary = describeChange(change, actor.embedLabel, fileLink);

  const contentParts = [actor.mention, summary.contentSummary, roleMention].filter(Boolean);
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

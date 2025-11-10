const MAX_COMMENT_LENGTH = 180;
const LIST_MOVE_KEY = 'idList';
const CLOSED_FLAG_KEY = 'closed';

function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}...`;
}

function formatList(list) {
  return list?.name ? `dans **${list.name}**` : '';
}

function formatCardLink(card) {
  if (!card) {
    return null;
  }
  const url = card.shortUrl || (card.shortLink ? `https://trello.com/c/${card.shortLink}` : undefined);
  if (!url) {
    return `"${card.name}"`;
  }
  return `[${card.name}](${url})`;
}

function isListMove(data = {}) {
  if (!Object.prototype.hasOwnProperty.call(data.old || {}, LIST_MOVE_KEY)) {
    return false;
  }
  const previousListId = data.old?.idList;
  const newListId = data.card?.idList || data.listAfter?.id || data.list?.id;
  if (!previousListId || !newListId) {
    return false;
  }
  return previousListId !== newListId;
}

function isArchiveAction(data = {}) {
  if (!Object.prototype.hasOwnProperty.call(data.old || {}, CLOSED_FLAG_KEY)) {
    return false;
  }
  return Boolean(data.card?.closed);
}

function shouldNotifyAction(action) {
  if (!action) {
    return false;
  }

  const { type, data = {} } = action;

  switch (type) {
    case 'commentCard':
    case 'addAttachmentToCard':
    case 'addMemberToCard':
      return true;
    case 'updateCard':
      return isListMove(data) || isArchiveAction(data);
    default:
      return false;
  }
}

function buildActionSummary(action) {
  const { type, data } = action;
  const cardLink = formatCardLink(data.card);
  const boardName = data.board?.name;

  switch (type) {
    case 'createCard':
      return `a cree la carte ${cardLink || 'nouvelle carte'} ${formatList(data.list)}.`;
    case 'copyCard':
      return `a copie la carte ${cardLink || 'nouvelle carte'} depuis **${data.cardSource?.name || 'une autre carte'}**.`;
    case 'moveCardToBoard':
      return `a deplace la carte ${cardLink} vers le tableau **${boardName || data.boardTarget?.name}**.`;
    case 'updateCard':
      if (data.old?.name) {
        return `a renomme la carte ${cardLink} (ancien nom: "${data.old.name}").`;
      }
      if (Object.prototype.hasOwnProperty.call(data.old || {}, 'desc')) {
        return `a mis a jour la description de ${cardLink}.`;
      }
      if (data.old?.idList) {
        return `a deplace la carte ${cardLink} de **${data.listBefore?.name || 'une liste'}** vers **${data.listAfter?.name || 'une autre liste'}**.`;
      }
      if (Object.prototype.hasOwnProperty.call(data.old || {}, 'closed')) {
        return `${data.card?.closed ? 'a archive' : 'a restaure'} la carte ${cardLink}.`;
      }
      return `a mis a jour la carte ${cardLink}.`;
    case 'commentCard':
      return `a commente la carte ${cardLink} : "${truncate(data.text, MAX_COMMENT_LENGTH)}".`;
    case 'addAttachmentToCard':
      return `a ajoute la piece jointe "${data.attachment?.name || data.attachment?.url}" a ${cardLink}.`;
    case 'addMemberToCard':
      return `a ajoute ${data.member?.fullName || data.member?.username || 'un membre'} a ${cardLink}.`;
    case 'removeMemberFromCard':
      return `a retire ${data.member?.fullName || data.member?.username || 'un membre'} de ${cardLink}.`;
    case 'addChecklistToCard':
      return `a ajoute la checklist **${data.checklist?.name}** a ${cardLink}.`;
    case 'updateCheckItemStateOnCard':
      return `${data.checkItem?.state === 'complete' ? 'a coche' : 'a decoche'} l'item "${data.checkItem?.name}" dans ${cardLink}.`;
    case 'createChecklist':
      return `a cree la checklist **${data.checklist?.name}** sur ${cardLink}.`;
    case 'deleteCard':
      return `a supprime la carte "${data.card?.name}" du tableau **${boardName}**.`;
    default:
      return `a effectue l'action ${type} sur ${cardLink || 'le tableau'}.`;
  }
}

function buildFields(action) {
  const { data } = action;
  const fields = [];

  if (data.board?.name) {
    fields.push({ name: 'Tableau', value: data.board.name, inline: true });
  }
  const before = data.listBefore?.name;
  const after = data.listAfter?.name || data.list?.name;
  if (before || after) {
    if (before && after && before !== after) {
      fields.push({ name: 'Liste', value: `${before} -> ${after}`, inline: true });
    } else if (after) {
      fields.push({ name: 'Liste', value: after, inline: true });
    }
  }

  if (data.card?.due) {
    fields.push({ name: 'Echeance', value: new Date(data.card.due).toLocaleString(), inline: true });
  }

  return fields;
}

function formatAction(action, actorDisplay, roleMention) {
  const summary = buildActionSummary(action);
  const content = `${roleMention} ${actorDisplay} ${summary}`.trim();

  const embed = {
    color: 0x0055ff,
    description: summary,
    timestamp: action.date,
    footer: { text: `Action Trello - ${action.id}` },
    fields: buildFields(action),
  };

  return { content, embeds: [embed] };
}

module.exports = {
  formatAction,
  shouldNotifyAction,
};

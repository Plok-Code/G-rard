const config = require('../config');
const { sendActionMessage } = require('../discord/notifier');
const { createDriveClient } = require('./client');
const { loadState, saveState } = require('./stateStore');
const { formatChange } = require('./formatter');

let driveClient = null;
let state = null;
let pollTimer = null;

const scopeResolutionCache = new Map();
const parentCache = new Map();
const lastNotificationByFile = new Map();

function ensureState() {
  if (!state) {
    state = loadState();
  }
  if (!Array.isArray(state.recentChangeIds)) {
    state.recentChangeIds = [];
  }
  if (!driveClient) {
    driveClient = createDriveClient();
  }
}

function resetState() {
  state = {
    pageToken: null,
    initialSyncCompleted: false,
    recentChangeIds: [],
  };
  saveState(state);
  scopeResolutionCache.clear();
  parentCache.clear();
  lastNotificationByFile.clear();
}

function buildRequestBase() {
  const base = {
    includeRemoved: true,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    pageSize: 100,
    fields:
      'nextPageToken,newStartPageToken,changes(fileId,time,file(name,mimeType,trashed,webViewLink,createdTime,modifiedTime,parents,owners(displayName,emailAddress),lastModifyingUser(displayName,emailAddress)),removed)',
  };

  if (config.drive.sharedDriveId) {
    base.driveId = config.drive.sharedDriveId;
    base.corpora = 'drive';
  }

  return base;
}

async function fetchParents(fileId) {
  if (!fileId) {
    return [];
  }
  if (parentCache.has(fileId)) {
    return parentCache.get(fileId);
  }

  try {
    const response = await driveClient.files.get({
      fileId,
      fields: 'id, parents',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });
    const parents = response.data.parents || [];
    parentCache.set(fileId, parents);
    return parents;
  } catch (error) {
    parentCache.set(fileId, []);
    return [];
  }
}

async function isAncestorInScope(folderId, visited = new Set()) {
  if (scopeResolutionCache.has(folderId)) {
    return scopeResolutionCache.get(folderId);
  }

  if (folderId === config.drive.monitoredFolderId) {
    scopeResolutionCache.set(folderId, true);
    return true;
  }

  if (visited.has(folderId)) {
    scopeResolutionCache.set(folderId, false);
    return false;
  }
  visited.add(folderId);

  const parents = await fetchParents(folderId);

  if (!parents.length) {
    scopeResolutionCache.set(folderId, false);
    return false;
  }

  for (const parentId of parents) {
    if (parentId === config.drive.monitoredFolderId) {
      scopeResolutionCache.set(folderId, true);
      return true;
    }
    const inScope = await isAncestorInScope(parentId, visited);
    if (inScope) {
      scopeResolutionCache.set(folderId, true);
      return true;
    }
  }

  scopeResolutionCache.set(folderId, false);
  return false;
}

async function isChangeInScope(change) {
  if (!config.drive.monitoredFolderId) {
    return true;
  }

  if (change.removed) {
    return true;
  }

  const parents = change.file?.parents || [];
  if (!parents.length) {
    return false;
  }

  for (const parentId of parents) {
    if (parentId === config.drive.monitoredFolderId) {
      scopeResolutionCache.set(change.fileId, true);
      return true;
    }
    if (await isAncestorInScope(parentId)) {
      scopeResolutionCache.set(change.fileId, true);
      return true;
    }
  }

  scopeResolutionCache.set(change.fileId, false);
  return false;
}

async function filterRelevantChanges(changes) {
  const latestPerFile = new Map();

  for (const change of changes) {
    if (!change.fileId) {
      continue;
    }

    const inScope = await isChangeInScope(change);
    if (!inScope) {
      continue;
    }

    const existing = latestPerFile.get(change.fileId);

    if (!existing) {
      latestPerFile.set(change.fileId, change);
      continue;
    }

    const existingTime = new Date(existing.file?.modifiedTime || existing.time || 0).getTime();
    const candidateTime = new Date(change.file?.modifiedTime || change.time || 0).getTime();

    if (candidateTime >= existingTime) {
      latestPerFile.set(change.fileId, change);
    }
  }

  return Array.from(latestPerFile.values());
}

function shouldThrottle(change, summaryDetails) {
  if (!config.drive.updateCooldownMs || summaryDetails !== 'Mise a jour') {
    return false;
  }

  const last = lastNotificationByFile.get(change.fileId) || 0;
  const now = Date.now();
  if (now - last < config.drive.updateCooldownMs) {
    return true;
  }
  lastNotificationByFile.set(change.fileId, now);
  return false;
}

async function ensureStartPageToken() {
  if (!state.pageToken) {
    const options = {
      supportsAllDrives: true,
    };
    if (config.drive.sharedDriveId) {
      options.driveId = config.drive.sharedDriveId;
    }

    const response = await driveClient.changes.getStartPageToken(options);
    state.pageToken = response.data.startPageToken;
    state.initialSyncCompleted = false;
    saveState(state);
    console.log('[Drive] Start page token initialise', state.pageToken);
  }
}

async function processChanges() {
  ensureState();
  await ensureStartPageToken();

  let pageToken = state.pageToken;
  const isInitialSync = !state.initialSyncCompleted;

  if (!pageToken) {
    return;
  }

  let keepFetching = true;
  let latestToken = pageToken;
  const processedChangeIds = new Set(state.recentChangeIds || []);
  const newlyProcessedIds = [];

  while (keepFetching) {
    const response = await driveClient.changes.list({
      ...buildRequestBase(),
      pageToken,
    });

    const changes = response.data.changes || [];
    const relevantChanges = await filterRelevantChanges(changes);

    if (!isInitialSync && relevantChanges.length > 0) {
      for (const change of relevantChanges) {
        if (processedChangeIds.has(change.id)) {
          continue;
        }

        processedChangeIds.add(change.id);
        newlyProcessedIds.push(change.id);

        const roleId = config.discord.drivePingRoleId || config.discord.pingRoleId;
        const roleMention = roleId ? `<@&${roleId}>` : '';
        try {
          const message = formatChange(change, roleMention);

          const detailsField = message.embeds?.[0]?.fields?.find((field) => field.name === 'Action');
          const shouldSkip = detailsField && shouldThrottle(change, detailsField.value);
          if (shouldSkip) {
            continue;
          }

          await sendActionMessage(message, { channelId: config.discord.driveChannelId });
        } catch (error) {
          console.error('[Drive] Erreur lors de lenvoi du message Discord', error);
        }
      }
    }

    if (response.data.nextPageToken) {
      pageToken = response.data.nextPageToken;
      latestToken = pageToken;
    } else {
      latestToken = response.data.newStartPageToken || latestToken;
      keepFetching = false;
    }
  }

  state.pageToken = latestToken;
  state.initialSyncCompleted = true;
  if (newlyProcessedIds.length > 0) {
    const existing = state.recentChangeIds || [];
    state.recentChangeIds = [...existing, ...newlyProcessedIds].slice(-200);
  }
  saveState(state);
}

async function pollOnce() {
  if (!config.drive.enabled) {
    return;
  }

  try {
    await processChanges();
  } catch (error) {
    if (error.code === 404) {
      console.warn('[Drive] Token change invalide, reinitialisation');
      resetState();
    } else {
      console.error('[Drive] Erreur lors de la recuperation des changements', error);
    }
  }
}

function startDriveMonitor() {
  if (!config.drive.enabled) {
    console.log('[Drive] Integration Drive desactivee (variables manquantes).');
    return;
  }

  if (!config.discord.driveChannelId) {
    console.warn('[Drive] Aucune channel Discord configuree pour Drive.');
    return;
  }

  if (pollTimer) {
    return;
  }

  console.log('[Drive] Surveillance des changements Drive demarree');
  pollOnce();
  pollTimer = setInterval(pollOnce, config.drive.pollIntervalMs);
}

function stopDriveMonitor() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

module.exports = {
  startDriveMonitor,
  stopDriveMonitor,
};

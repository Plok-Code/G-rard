const CREATION_WINDOW_MS = 5000;

function isRecentCreation(file) {
  if (!file?.createdTime || !file?.modifiedTime) {
    return false;
  }
  const created = new Date(file.createdTime).getTime();
  const modified = new Date(file.modifiedTime).getTime();
  return Math.abs(modified - created) < CREATION_WINDOW_MS;
}

function isDeletion(change) {
  return Boolean(change?.removed || change?.file?.trashed);
}

function shouldNotifyDriveChange(change) {
  if (!change) {
    return false;
  }

  if (isDeletion(change)) {
    return true;
  }

  if (change.file && isRecentCreation(change.file)) {
    return true;
  }

  return false;
}

module.exports = {
  shouldNotifyDriveChange,
};

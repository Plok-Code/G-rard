const fs = require('fs');
const path = require('path');
const config = require('../config');

function ensureDirectory(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadState() {
  try {
    const content = fs.readFileSync(config.drive.stateFile, 'utf8');
    const parsed = JSON.parse(content);
    return {
      pageToken: parsed.pageToken || null,
      initialSyncCompleted: Boolean(parsed.initialSyncCompleted),
    };
  } catch (error) {
    return { pageToken: null, initialSyncCompleted: false };
  }
}

function saveState(state) {
  ensureDirectory(config.drive.stateFile);
  fs.writeFileSync(
    config.drive.stateFile,
    JSON.stringify(
      {
        pageToken: state.pageToken || null,
        initialSyncCompleted: Boolean(state.initialSyncCompleted),
      },
      null,
      2,
    ),
  );
}

module.exports = {
  loadState,
  saveState,
};

const { google } = require('googleapis');
const config = require('../config');

function assertDriveConfigured() {
  if (!config.drive.enabled) {
    throw new Error('Google Drive n\'est pas configure. Verifiez les variables d\'environnement.');
  }
}

function createAuthClient() {
  assertDriveConfigured();
  return new google.auth.JWT({
    email: config.drive.serviceAccountEmail,
    key: config.drive.privateKey,
    scopes: ['https://www.googleapis.com/auth/drive.metadata.readonly'],
  });
}

function createDriveClient() {
  const auth = createAuthClient();
  return google.drive({ version: 'v3', auth });
}

module.exports = {
  createAuthClient,
  createDriveClient,
};

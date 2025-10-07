const crypto = require('crypto');
const config = require('../config');

function computeSignature(callbackUrl, body) {
  return crypto
    .createHmac('sha1', config.trello.verificationSecret)
    .update(`${body || ''}${callbackUrl}`)
    .digest('base64');
}

function isValidSignature(signature, body) {
  if (!signature) {
    return false;
  }

  const expected = computeSignature(config.trello.callbackUrl, body);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

module.exports = {
  computeSignature,
  isValidSignature,
};

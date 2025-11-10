const crypto = require('crypto');
const config = require('../config');

function computeSignature(body) {
  if (!config.github.webhookSecret) {
    return null;
  }
  return `sha256=${crypto
    .createHmac('sha256', config.github.webhookSecret)
    .update(body)
    .digest('hex')}`;
}

function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function isValidSignature(signature, body) {
  if (!config.github.webhookSecret) {
    return true;
  }
  if (!signature || !body) {
    return false;
  }
  const expected = computeSignature(body);
  return expected ? timingSafeCompare(signature, expected) : false;
}

module.exports = {
  isValidSignature,
};

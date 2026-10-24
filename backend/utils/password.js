




const { randomBytes, scryptSync, timingSafeEqual } = require('crypto');

function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);

  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') {
    return false;
  }

  if (!/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/i.test(storedHash)) {
    return false;
  }

  const [, saltHex, hashHex] = storedHash.split('$');
  const savedKey = Buffer.from(hashHex, 'hex');
  const attemptedKey = scryptSync(password, Buffer.from(saltHex, 'hex'), 64);

  return timingSafeEqual(savedKey, attemptedKey);
}

module.exports = { verifyPassword ,hashPassword};
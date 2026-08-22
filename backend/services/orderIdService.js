const crypto = require('crypto');

function generateOrderId() {
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `VNZ-${randomChars}`;
}

function generateReturnId() {
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `RET-${randomChars}`;
}

module.exports = { generateOrderId, generateReturnId };

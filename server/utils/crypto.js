const crypto = require('crypto');

/**
 * Normalizes an interest string and generates a deterministic HMAC-SHA256 hash.
 * 
 * @param {string} rawInterest - The raw text entered by the user (e.g., "  Rock Climbing! ")
 * @returns {string} - The blinded hex hash string to be saved in MongoDB
 */
function hashInterest(rawInterest) {
  const pepper = process.env.SERVER_PEPPER;

  if (!pepper) {
    throw new Error("❌ CRITICAL: SERVER_PEPPER is missing from environment variables!");
  }

  // 1. Normalize: lowercase, trim whitespace, and clean extra spaces
  const normalized = rawInterest.trim().toLowerCase().replace(/\s+/g, ' ');

  // 2. Create HMAC-SHA256 hash using the secret server pepper
  const hash = crypto
    .createHmac('sha256', pepper)
    .update(normalized)
    .digest('hex');

  return hash;
}

/**
 * Helper to hash an entire array of incoming interest objects.
 * Expects objects like: { name: "hiking", category: "outdoors", weight: 1.0 }
 */
function processInterestsForStorage(interestsArray) {
  return interestsArray.map(item => ({
    hash: hashInterest(item.name),
    category: item.category.trim().toLowerCase(),
    weight: item.weight || 1.0
  }));
}

module.exports = {
  hashInterest,
  processInterestsForStorage
};
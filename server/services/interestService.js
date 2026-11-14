const MasterInterest = require('../models/MasterInterest');
const { hashInterest } = require('../utils/crypto');

async function getEmbedding(text) {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      input: [text],
      model: "voyage-3-lite"
    })
  });

  const data = await response.json();
  if (!data.data || !data.data[0]) {
    throw new Error(`Voyage AI Error: ${JSON.stringify(data)}`);
  }
  return data.data[0].embedding;
}

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Fetches interests from MongoDB, snaps raw text via Voyage AI vector similarity,
 * and returns a blind HMAC hash.
 */
async function processAndHashInterest(rawText) {
  // 1. Fetch all pre-set master interests & their stored embeddings from MongoDB
  const masterInterests = await MasterInterest.find({});
  if (masterInterests.length === 0) {
    throw new Error("MasterInterest collection is empty. Run node seedInterests.js first.");
  }

  // 2. Embed the user's free-text input via Voyage AI
  const userVector = await getEmbedding(rawText);

  // 3. Find the closest pre-set interest from MongoDB
  let bestMatch = masterInterests[0];
  let highestScore = -1;

  for (const item of masterInterests) {
    if (!item.embedding || item.embedding.length === 0) continue;
    const score = cosineSimilarity(userVector, item.embedding);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  console.log(`🔍 MongoDB Taxonomy Match: "${rawText}" -> "${bestMatch.canonicalTag}" (Score: ${highestScore.toFixed(2)})`);

  // 4. Blind-hash the matched canonical tag
  const blindHash = hashInterest(bestMatch.canonicalTag);

  return {
    hash: blindHash,
    category: bestMatch.category,
    weight: 1.0
  };
}

module.exports = { processAndHashInterest };
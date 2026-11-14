
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  httpOptions: {
    timeout: 30000,
    retryOptions: {
      attempts: 1
    }
  }
});

// Primary and backup models
const MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-4-hydrogen',
  'gemini-4-argon',
  'gemini-4-carbon'
];

async function extractTag(rawText) {
  const prompt = `
    You are a hobby normalization agent.

    Extract a clean, lowercase canonical tag (1-3 words)
    and a broad category from this user input:

    "${rawText}"

    Respond ONLY with valid JSON in this exact format:
    {"tag": "canonical tag here", "category": "category here"}
  `;

  for (const model of MODELS) {
    try {
      console.log(`🤖 Trying ${model}...`);

      const response = await ai.models.generateContent({
        model,
        contents: prompt
      });

      const textResponse = response.text
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/, '');

      const result = JSON.parse(textResponse);

      if (
        typeof result.tag !== 'string' ||
        typeof result.category !== 'string' ||
        !result.tag.trim() ||
        !result.category.trim()
      ) {
        throw new Error('Invalid JSON response');
      }

      console.log(`✅ Successfully extracted using ${model}`);

      return {
        tag: result.tag.trim().toLowerCase(),
        category: result.category.trim().toLowerCase()
      };

    } catch (error) {

      if (error.status === 503) {
        console.warn(
          `⚠️ ${model} unavailable (503). Switching models immediately...`
        );

        continue;
      }

      console.error(`❌ ${model} failed:`, error.message);
      break;
    }
  }

  // Both models unavailable, or another error occurred
  console.warn('⚠️ Using local extraction fallback.');

  return {
    tag: rawText.trim().toLowerCase(),
    category: 'general'
  };
}

module.exports = { extractTag };

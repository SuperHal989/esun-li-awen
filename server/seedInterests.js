const mongoose = require('mongoose');
require('dotenv').config();
const MasterInterest = require('./models/MasterInterest');


const PRESET_LIST = [
  // OUTDOORS & ADVENTURE
  { tag: "hiking", category: "outdoors" },
  { tag: "camping", category: "outdoors" },
  { tag: "rock climbing", category: "outdoors" },
  { tag: "cycling", category: "outdoors" },
  { tag: "backpacking", category: "outdoors" },
  { tag: "mountaineering", category: "outdoors" },
  { tag: "trail running", category: "outdoors" },
  { tag: "birdwatching", category: "outdoors" },
  { tag: "fishing", category: "outdoors" },
  { tag: "kayaking", category: "outdoors" },
  { tag: "canoeing", category: "outdoors" },
  { tag: "paddleboarding", category: "outdoors" },
  { tag: "surfing", category: "outdoors" },
  { tag: "scuba diving", category: "outdoors" },
  { tag: "snorkeling", category: "outdoors" },
  { tag: "sailing", category: "outdoors" },
  { tag: "geocaching", category: "outdoors" },
  { tag: "nature photography", category: "outdoors" },
  { tag: "gardening", category: "outdoors" },
  { tag: "foraging", category: "outdoors" },
  { tag: "wildlife conservation", category: "outdoors" },
  { tag: "rock collecting", category: "outdoors" },
  { tag: "stargazing", category: "outdoors" },
  { tag: "off-roading", category: "outdoors" },
  { tag: "survival skills", category: "outdoors" },

  // GAMING
  { tag: "competitive pokemon", category: "gaming" },
  { tag: "speedrunning", category: "gaming" },
  { tag: "board games", category: "gaming" },
  { tag: "roleplaying games", category: "gaming" },
  { tag: "video games", category: "gaming" },
  { tag: "indie games", category: "gaming" },
  { tag: "retro gaming", category: "gaming" },
  { tag: "fighting games", category: "gaming" },
  { tag: "competitive gaming", category: "gaming" },
  { tag: "esports", category: "gaming" },
  { tag: "tabletop gaming", category: "gaming" },
  { tag: "dungeons and dragons", category: "gaming" },
  { tag: "magic the gathering", category: "gaming" },
  { tag: "warhammer", category: "gaming" },
  { tag: "chess", category: "gaming" },
  { tag: "go", category: "gaming" },
  { tag: "puzzle games", category: "gaming" },
  { tag: "strategy games", category: "gaming" },
  { tag: "simulation games", category: "gaming" },
  { tag: "sandbox games", category: "gaming" },
  { tag: "minecraft", category: "gaming" },
  { tag: "game modding", category: "gaming" },
  { tag: "game development", category: "gaming" },
  { tag: "game design", category: "gaming" },
  { tag: "virtual reality gaming", category: "gaming" },

  // TECHNOLOGY & PROGRAMMING
  { tag: "rust programming", category: "tech" },
  { tag: "web development", category: "tech" },
  { tag: "artificial intelligence", category: "tech" },
  { tag: "linux", category: "tech" },
  { tag: "python programming", category: "tech" },
  { tag: "javascript programming", category: "tech" },
  { tag: "typescript", category: "tech" },
  { tag: "machine learning", category: "tech" },
  { tag: "deep learning", category: "tech" },
  { tag: "data science", category: "tech" },
  { tag: "data engineering", category: "tech" },
  { tag: "cybersecurity", category: "tech" },
  { tag: "ethical hacking", category: "tech" },
  { tag: "open source software", category: "tech" },
  { tag: "self hosting", category: "tech" },
  { tag: "homelab", category: "tech" },
  { tag: "cloud computing", category: "tech" },
  { tag: "devops", category: "tech" },
  { tag: "robotics", category: "tech" },
  { tag: "electronics", category: "tech" },
  { tag: "arduino", category: "tech" },
  { tag: "raspberry pi", category: "tech" },
  { tag: "3d printing", category: "tech" },
  { tag: "hardware tinkering", category: "tech" },
  { tag: "game development", category: "tech" },
  { tag: "mobile app development", category: "tech" },
  { tag: "blockchain technology", category: "tech" },
  { tag: "cryptography", category: "tech" },
  { tag: "computer networking", category: "tech" },
  { tag: "operating systems", category: "tech" },

  // CULTURE & ENTERTAINMENT
  { tag: "sci-fi novels", category: "culture" },
  { tag: "photography", category: "culture" },
  { tag: "independent film", category: "culture" },
  { tag: "coffee tasting", category: "culture" },
  { tag: "fantasy literature", category: "culture" },
  { tag: "horror movies", category: "culture" },
  { tag: "documentary films", category: "culture" },
  { tag: "anime", category: "culture" },
  { tag: "manga", category: "culture" },
  { tag: "comic books", category: "culture" },
  { tag: "graphic novels", category: "culture" },
  { tag: "animation", category: "culture" },
  { tag: "film criticism", category: "culture" },
  { tag: "film photography", category: "culture" },
  { tag: "street photography", category: "culture" },
  { tag: "architecture", category: "culture" },
  { tag: "fashion", category: "culture" },
  { tag: "streetwear", category: "culture" },
  { tag: "music production", category: "culture" },
  { tag: "vinyl collecting", category: "culture" },
  { tag: "classical music", category: "culture" },
  { tag: "jazz", category: "culture" },
  { tag: "electronic music", category: "culture" },
  { tag: "live music", category: "culture" },
  { tag: "podcasts", category: "culture" },
  { tag: "creative writing", category: "culture" },
  { tag: "poetry", category: "culture" },
  { tag: "book collecting", category: "culture" },
  { tag: "history", category: "culture" },
  { tag: "mythology", category: "culture" },
  { tag: "philosophy", category: "culture" },

  // SPORTS & FITNESS
  { tag: "basketball", category: "sports" },
  { tag: "soccer", category: "sports" },
  { tag: "football", category: "sports" },
  { tag: "baseball", category: "sports" },
  { tag: "hockey", category: "sports" },
  { tag: "tennis", category: "sports" },
  { tag: "badminton", category: "sports" },
  { tag: "volleyball", category: "sports" },
  { tag: "table tennis", category: "sports" },
  { tag: "golf", category: "sports" },
  { tag: "martial arts", category: "sports" },
  { tag: "boxing", category: "sports" },
  { tag: "kickboxing", category: "sports" },
  { tag: "jiu jitsu", category: "sports" },
  { tag: "wrestling", category: "sports" },
  { tag: "weightlifting", category: "sports" },
  { tag: "powerlifting", category: "sports" },
  { tag: "bodybuilding", category: "sports" },
  { tag: "calisthenics", category: "sports" },
  { tag: "yoga", category: "sports" },
  { tag: "pilates", category: "sports" },
  { tag: "running", category: "sports" },
  { tag: "marathon running", category: "sports" },
  { tag: "swimming", category: "sports" },
  { tag: "figure skating", category: "sports" },
  { tag: "ice skating", category: "sports" },
  { tag: "rock climbing fitness", category: "sports" },
  { tag: "disc golf", category: "sports" },

  // ART & CREATIVE HOBBIES
  { tag: "digital art", category: "creative" },
  { tag: "traditional painting", category: "creative" },
  { tag: "drawing", category: "creative" },
  { tag: "illustration", category: "creative" },
  { tag: "graphic design", category: "creative" },
  { tag: "3d modeling", category: "creative" },
  { tag: "sculpting", category: "creative" },
  { tag: "ceramics", category: "creative" },
  { tag: "pottery", category: "creative" },
  { tag: "woodworking", category: "creative" },
  { tag: "metalworking", category: "creative" },
  { tag: "sewing", category: "creative" },
  { tag: "knitting", category: "creative" },
  { tag: "crocheting", category: "creative" },
  { tag: "embroidery", category: "creative" },
  { tag: "leatherworking", category: "creative" },
  { tag: "calligraphy", category: "creative" },
  { tag: "origami", category: "creative" },
  { tag: "cosplay", category: "creative" },
  { tag: "prop making", category: "creative" },
  { tag: "interior design", category: "creative" },
  { tag: "creative writing", category: "creative" },
  { tag: "songwriting", category: "creative" },
  { tag: "playing guitar", category: "creative" },
  { tag: "playing piano", category: "creative" },
  { tag: "drumming", category: "creative" },
  { tag: "singing", category: "creative" },

  // FOOD & DRINK
  { tag: "cooking", category: "food" },
  { tag: "baking", category: "food" },
  { tag: "bread making", category: "food" },
  { tag: "sourdough baking", category: "food" },
  { tag: "home brewing", category: "food" },
  { tag: "tea tasting", category: "food" },
  { tag: "specialty coffee", category: "food" },
  { tag: "espresso making", category: "food" },
  { tag: "mixology", category: "food" },
  { tag: "food photography", category: "food" },
  { tag: "fermentation", category: "food" },
  { tag: "cheese making", category: "food" },
  { tag: "vegetarian cooking", category: "food" },
  { tag: "vegan cooking", category: "food" },
  { tag: "international cuisine", category: "food" },

  // SCIENCE & LEARNING
  { tag: "astronomy", category: "science" },
  { tag: "physics", category: "science" },
  { tag: "chemistry", category: "science" },
  { tag: "biology", category: "science" },
  { tag: "neuroscience", category: "science" },
  { tag: "psychology", category: "science" },
  { tag: "mathematics", category: "science" },
  { tag: "statistics", category: "science" },
  { tag: "geology", category: "science" },
  { tag: "paleontology", category: "science" },
  { tag: "linguistics", category: "science" },
  { tag: "learning languages", category: "science" },
  { tag: "economics", category: "science" },
  { tag: "political science", category: "science" },
  { tag: "archaeology", category: "science" },

  // LIFESTYLE & SOCIAL
  { tag: "travel", category: "lifestyle" },
  { tag: "solo travel", category: "lifestyle" },
  { tag: "backpacking travel", category: "lifestyle" },
  { tag: "minimalism", category: "lifestyle" },
  { tag: "personal finance", category: "lifestyle" },
  { tag: "investing", category: "lifestyle" },
  { tag: "entrepreneurship", category: "lifestyle" },
  { tag: "volunteering", category: "lifestyle" },
  { tag: "community building", category: "lifestyle" },
  { tag: "personal development", category: "lifestyle" },
  { tag: "meditation", category: "lifestyle" },
  { tag: "journaling", category: "lifestyle" },
  { tag: "collecting antiques", category: "lifestyle" },
  { tag: "thrifting", category: "lifestyle" },
  { tag: "car culture", category: "lifestyle" },
  { tag: "motorcycles", category: "lifestyle" },
  { tag: "automotive restoration", category: "lifestyle" },
  { tag: "home improvement", category: "lifestyle" },
  { tag: "aquariums", category: "lifestyle" },
  { tag: "houseplants", category: "lifestyle" },
  { tag: "pet care", category: "lifestyle" },

  // PROFESSIONAL & BUSINESS
  { tag: "product management", category: "professional" },
  { tag: "user experience design", category: "professional" },
  { tag: "marketing", category: "professional" },
  { tag: "digital marketing", category: "professional" },
  { tag: "content creation", category: "professional" },
  { tag: "freelancing", category: "professional" },
  { tag: "startups", category: "professional" },
  { tag: "business strategy", category: "professional" },
  { tag: "public speaking", category: "professional" },
  { tag: "leadership", category: "professional" },
  { tag: "project management", category: "professional" },
  { tag: "technical writing", category: "professional" },
  { tag: "academic research", category: "professional" }
];


async function getEmbeddings(texts) {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`
    },
    body: JSON.stringify({
      input: texts,
      model: "voyage-3-lite"
    })
  });
  const data = await response.json();
  if (!data.data) throw new Error(`Voyage AI Error: ${JSON.stringify(data)}`);
  return data.data.map(item => item.embedding);
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("🍃 Connected to MongoDB. Generating embeddings...");

  const tags = PRESET_LIST.map(item => item.tag);
  const embeddings = await getEmbeddings(tags);

  await MasterInterest.deleteMany({}); // Clear old entries

  const docs = PRESET_LIST.map((item, idx) => ({
    canonicalTag: item.tag,
    category: item.category,
    embedding: embeddings[idx]
  }));

  await MasterInterest.insertMany(docs);
  console.log(`✅ Successfully seeded ${docs.length} pre-set interests into MongoDB!`);
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
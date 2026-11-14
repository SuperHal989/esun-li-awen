const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 
const { processAndHashInterest } = require('../services/interestService');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, birthday, avatarUrl, interests } = req.body;

    // 1. Basic validation
    if (!username || !password || !name || !birthday) {
      return res.status(400).json({ error: "Missing required fields (username, password, name, birthday)" });
    }

    // 2. Check if username already exists in MongoDB
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    // 3. Hash the user's password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Process incoming raw interests through Voyage AI MongoDB Taxonomy matching & Blind-Hash
    const secureInterests = [];
    if (interests && Array.isArray(interests)) {
      for (const rawText of interests) {
        const secureInterest = await processAndHashInterest(rawText);
        secureInterests.push(secureInterest);
      }
    }

    // 5. Create the new user document for MongoDB Atlas
    const newUser = new User({
      username: username.toLowerCase().trim(),
      passwordHash,
      name,
      birthday: new Date(birthday),
      avatarUrl: avatarUrl || '',
      interests: secureInterests,
      lastActiveAt: new Date() // Starts the 1-year TTL countdown timer
    });

    // 6. Save to MongoDB
    await newUser.save();

    res.status(201).json({ 
      message: "User registered successfully with privacy-first storage!",
      username: newUser.username 
    });

  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
});

module.exports = router;
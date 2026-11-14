const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Path to your User model

const router = express.Router();

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validate inputs
    if (!username || !password) {
      return res.status(400).json({ error: "Please provide both username and password." });
    }

    const normalizedUsername = username.toLowerCase().trim();

    // 2. Find user in MongoDB Atlas
    const user = await User.findOne({ username: normalizedUsername });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // 3. Compare supplied password with the stored hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // 4. Refresh the 1-year TTL countdown timer upon successful login
    user.lastActiveAt = new Date();
    await user.save();

    // 5. Generate a JSON Web Token (JWT) valid for 7 days
    const tokenPayload = { userId: user._id, username: user.username };
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("CRITICAL: JWT_SECRET is missing from environment variables!");
    }

    const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '7d' });

    // 6. Send back the token and basic user info (zero sensitive crypto keys or raw data leaked)
    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ error: "Internal server error during login." });
  }
});

module.exports = router;
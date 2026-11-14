const express = require('express');
const User = require('../models/User');
const { processAndHashInterest } = require('../services/interestService');
const verifyToken = require('../middleware/auth'); // 🔒 Import auth middleware

const router = express.Router();

// POST /api/interests/add (Protected by verifyToken)
router.post('/add', verifyToken, async (req, res) => {
  try {
    // 🛡️ Safely pull userId from the verified token, NOT the request body
    const userId = req.user.userId; 
    const { rawInterests } = req.body; 

    if (!rawInterests || !Array.isArray(rawInterests)) {
      return res.status(400).json({ error: "Invalid request payload. Missing rawInterests array." });
    }

    const processedInterests = [];

    for (const rawText of rawInterests) {
      // Directly snap raw text to the MongoDB MasterInterest taxonomy via Voyage AI & blind-hash
      const secureInterest = await processAndHashInterest(rawText);
      processedInterests.push(secureInterest);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $push: { interests: { $each: processedInterests } },
        lastActiveAt: new Date() // Refreshes the 1-year TTL countdown timer on action
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json({ 
      message: "Interests successfully processed and securely stored!",
      totalInterests: updatedUser.interests.length 
    });

  } catch (error) {
    console.error("❌ Error in /api/interests/add:", error);
    res.status(500).json({ error: "Internal server error while processing interests." });
  }
});

module.exports = router;
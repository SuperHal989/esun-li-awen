const express = require('express');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const { processAndHashInterest } = require('../services/interestService');

const router = express.Router();

function summarizeCategories(interests) {
  const counts = new Map();
  for (const { category } of interests) {
    const normalizedCategory = category.toLowerCase();
    const existing = counts.get(normalizedCategory);
    counts.set(normalizedCategory, {
      category: existing ? existing.category : category,
      count: (existing ? existing.count : 0) + 1
    });
  }
  return Array.from(counts.values());
}

// GET /api/settings/categories - Return category names and interest counts only
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('interests.category');
    if (!user) return res.status(404).json({ error: "User not found." });

    res.status(200).json({ categories: summarizeCategories(user.interests) });
  } catch (error) {
    console.error("❌ Fetch Interest Categories Error:", error);
    res.status(500).json({ error: "Failed to fetch interest categories." });
  }
});

// DELETE /api/settings/account - Delete user account and cleanup requests/messages
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Remove user from others' friends, sent/pending requests
    await User.updateMany({}, {
      $pull: { friends: userId, sentRequests: userId, pendingRequests: userId }
    });
    // Delete user document
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("❌ Account Deletion Error:", error);
    res.status(500).json({ error: "Failed to delete account." });
  }
});

// POST /api/settings/interests - Add a new interest (snapping to master taxonomy)
router.post('/interests', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rawText, weight } = req.body;

    if (!rawText) return res.status(400).json({ error: "Interest text is required." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    const processedInterest = await processAndHashInterest(rawText);
    const finalWeight = weight !== undefined ? Number(weight) : 3.0;

    // Check if user already has this interest hash
    const exists = user.interests.some(i => i.hash === processedInterest.hash);
    if (exists) {
      return res.status(400).json({ error: "You already added this interest!" });
    }

    user.interests.push({
      hash: processedInterest.hash,
      category: processedInterest.category,
      weight: finalWeight
    });

    await user.save();
    res.status(200).json({
      message: "Interest added successfully!",
      categories: summarizeCategories(user.interests)
    });
  } catch (error) {
    console.error("❌ Add Interest Error:", error);
    res.status(500).json({ error: "Failed to add interest." });
  }
});

// DELETE /api/settings/category/:categoryName - Delete all interests in a category
router.delete('/category/:categoryName', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { categoryName } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.interests = user.interests.filter(i => i.category.toLowerCase() !== categoryName.toLowerCase());
    await user.save();

    res.status(200).json({
      message: `Category ${categoryName} deleted successfully.`,
      categories: summarizeCategories(user.interests)
    });
  } catch (error) {
    console.error("❌ Delete Category Error:", error);
    res.status(500).json({ error: "Failed to delete category." });
  }
});

module.exports = router;
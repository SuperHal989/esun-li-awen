const express = require('express');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// GET /api/match
router.get('/', verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) return res.status(404).json({ error: "User not found." });

    if (!currentUser.interests || currentUser.interests.length === 0) {
      return res.status(200).json({ matches: [] });
    }

    const myInterestMap = new Map();
    for (const item of currentUser.interests) {
      myInterestMap.set(item.hash, item.weight);
    }
    const myHashes = Array.from(myInterestMap.keys());

    const excludedIds = [currentUser._id, ...(currentUser.friends || [])];
    const sentSet = new Set((currentUser.sentRequests || []).map(id => id.toString()));
    const pendingSet = new Set((currentUser.pendingRequests || []).map(id => id.toString()));

    const candidates = await User.find({
      _id: { $nin: excludedIds },
      'interests.hash': { $in: myHashes }
    }).select('username name avatarUrl interests');

    const scoredMatches = candidates.map(candidate => {
      let sharedCount = 0;
      let totalSimilarityScore = 0;
      const sharedCategories = new Set();

      for (const theirItem of candidate.interests) {
        if (myInterestMap.has(theirItem.hash)) {
          sharedCount += 1;
          sharedCategories.add(theirItem.category);
          const weightCloseness = 5.0 - Math.abs(myInterestMap.get(theirItem.hash) - theirItem.weight);
          totalSimilarityScore += weightCloseness;
        }
      }

      const candIdStr = candidate._id.toString();
      let requestStatus = 'none';
      if (sentSet.has(candIdStr)) requestStatus = 'pending';
      else if (pendingSet.has(candIdStr)) requestStatus = 'incoming';

      return {
        id: candidate._id,
        username: candidate.username,
        name: candidate.name,
        avatarUrl: candidate.avatarUrl,
        sharedCount,
        sharedCategories: Array.from(sharedCategories),
        compatibilityScore: Number(totalSimilarityScore.toFixed(2)),
        requestStatus
      };
    });

    scoredMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    res.status(200).json({ matches: scoredMatches });
  } catch (error) {
    console.error("❌ Matching Error:", error);
    res.status(500).json({ error: "Server error while finding matches." });
  }
});

// POST /api/match/add-friend/:targetId - Send friend request (or auto-accept if mutual)
router.post('/add-friend/:targetId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetId } = req.params;

    const currentUser = await User.findById(userId);
    const isMutual = (currentUser.pendingRequests || []).some(
      id => id.toString() === targetId
    );

    if (isMutual) {
      // Both users requested each other -> become confirmed friends!
      await User.findByIdAndUpdate(userId, {
        $addToSet: { friends: targetId },
        $pull: { pendingRequests: targetId, sentRequests: targetId }
      });
      await User.findByIdAndUpdate(targetId, {
        $addToSet: { friends: userId },
        $pull: { pendingRequests: userId, sentRequests: userId }
      });
      return res.status(200).json({ status: 'friends', message: "Mutual match! You are now friends." });
    }

    // Otherwise, mark as a pending request
    await User.findByIdAndUpdate(userId, { $addToSet: { sentRequests: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { pendingRequests: userId } });

    res.status(200).json({ status: 'pending', message: "Friend request sent!" });
  } catch (error) {
    console.error("❌ Add Friend Error:", error);
    res.status(500).json({ error: "Failed to send friend request." });
  }
});

// POST /api/match/cancel-request/:targetId - Cancel an outgoing pending request
router.post('/cancel-request/:targetId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetId } = req.params;

    await User.findByIdAndUpdate(userId, { $pull: { sentRequests: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { pendingRequests: userId } });

    res.status(200).json({ message: "Friend request cancelled." });
  } catch (error) {
    console.error("❌ Cancel Request Error:", error);
    res.status(500).json({ error: "Failed to cancel request." });
  }
});

module.exports = router;
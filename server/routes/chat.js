const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// GET /api/chat/friends - Get confirmed friends list for the sidebar
router.get('/friends', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('friends', 'username name avatarUrl');
    res.status(200).json({ friends: user.friends || [] });
  } catch (error) {
    console.error("❌ Fetch Friends Error:", error);
    res.status(500).json({ error: "Failed to fetch friends." });
  }
});

// GET /api/chat/messages/:friendId - Get message history between current user and a friend
router.get('/messages/:friendId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: friendId },
        { sender: friendId, recipient: userId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("❌ Fetch Messages Error:", error);
    res.status(500).json({ error: "Failed to fetch messages." });
  }
});

// POST /api/chat/send - Send a message to a friend
router.post('/send', verifyToken, async (req, res) => {
  try {
    const sender = req.user.userId;
    const { recipient, content } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({ error: "Recipient and content are required." });
    }

    const message = new Message({ sender, recipient, content });
    await message.save();

    res.status(201).json(message);
  } catch (error) {
    console.error("❌ Send Message Error:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
});

// POST /api/chat/rate-match - Adjust shared interest weights (+0.1 or -0.1)
router.post('/rate-match', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { friendId, adjustment } = req.body; // adjustment should be 0.1 or -0.1

    // Allow fine-grained increments/decrements (e.g., 0.1 or -0.1)
    if (![0.1, -0.1, 1, -1].includes(adjustment)) {
      return res.status(400).json({ error: "Invalid adjustment value." });
    }

    const currentUser = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!currentUser || !friend) {
      return res.status(404).json({ error: "User not found." });
    }

    const friendHashes = new Set(friend.interests.map(i => i.hash));
    
    // Update weights for shared interests (clamping between 0.1 and 5.0)
    currentUser.interests = currentUser.interests.map(item => {
      if (friendHashes.has(item.hash)) {
        let newWeight = Number((item.weight + adjustment).toFixed(1));
        if (newWeight > 5.0) newWeight = 5.0;
        if (newWeight < 0.1) newWeight = 0.1;
        return { ...(item.toObject ? item.toObject() : item), weight: newWeight };
      }
      return item;
    });

    await currentUser.save();
    res.status(200).json({ message: "Match weight alignment updated successfully." });
  } catch (error) {
    console.error("❌ Rate Match Error:", error);
    res.status(500).json({ error: "Failed to update match rating." });
  }
});

module.exports = router;
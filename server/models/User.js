
const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    index: true // Indexed for fast matching queries
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  weight: {
    type: Number,
    default: 1.0,
    min: 0.1,
    max: 5.0
  }
}, { _id: false });

const userSchema = new mongoose.Schema({

  // Basic Info
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  passwordHash: {
    type: String,
    required: true
  },

  name: {
    type: String,
    required: true
  },

  birthday: {
    type: Date,
    required: true
  },

  avatarUrl: {
    type: String,
    default: ''
  },

  // Cooldown tracker for category bulk deletions
  categoryCooldowns: {
    type: Map,
    of: Date,
    default: {}
  },

  // Cooldown tracker for name/birthday adjustments
  lastProfileUpdate: {
    type: Date,
    default: Date.now
  },

  // Blinded, hashed memory store
  interests: [interestSchema],

  // Inside your userSchema in server/models/User.js:
friends: [{ 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'User',
  default: [] 
}],
sentRequests: [{ 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'User',
  default: [] 
}],
pendingRequests: [{ 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'User',
  default: [] 
}],


  // Updated on every login
  lastActiveAt: {
    type: Date,
    default: Date.now
  }

}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// TTL INDEX: Automatically deletes users
// 1 year (31,536,000 seconds) after lastActiveAt
userSchema.index(
  { lastActiveAt: 1 },
  { expireAfterSeconds: 31536000 }
);

const User = mongoose.model('User', userSchema);

module.exports = User;

const mongoose = require('mongoose');

const masterInterestSchema = new mongoose.Schema({
  canonicalTag: { type: String, required: true, unique: true }, // e.g., "rock climbing"
  category: { type: String, required: true },                  // e.g., "outdoors"
  embedding: { type: [Number], required: true }                // Vector coordinates from Voyage AI
}, { timestamps: true });

const MasterInterest = mongoose.model('MasterInterest', masterInterestSchema);

module.exports = MasterInterest;
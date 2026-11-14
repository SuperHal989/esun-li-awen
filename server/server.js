const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect Routes
app.use('/api/auth', require('./routes/register'));
app.use('/api/auth', require('./routes/login'));
app.use('/api/interests', require('./routes/interests'));
app.use('/api/match', require('./routes/match'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/settings', require('./routes/settings'));

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('🍃 Connected to MongoDB Atlas Sandbox'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 server running on port ${PORT}`));
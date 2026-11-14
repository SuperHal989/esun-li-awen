const mongoose = require('mongoose');
require('dotenv').config(); // Loads variables from your .env file

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is missing in your .env file!");
  process.exit(1);
}

async function testConnection() {
  try {
    console.log("⏳ Connecting to MongoDB Atlas Sandbox...");
    
    // Connect to MongoDB
    await mongoose.connect(uri);
    
    console.log("✅ Successfully connected to MongoDB Atlas!");
    
    // Quick test: list database names to prove read access
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    console.log("📂 Available Databases in your Sandbox:");
    dbList.databases.forEach(db => console.log(`   - ${db.name}`));

    // Close connection cleanly
    await mongoose.connection.close();
    console.log("🔌 Connection closed successfully.");
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testConnection();
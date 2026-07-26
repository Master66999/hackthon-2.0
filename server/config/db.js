const mongoose = require('mongoose');
const dns = require('dns');

// Node.js Windows DNS resolver workaround for MongoDB Atlas querySrv
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if custom DNS fails
}

let isConnected = false;

/**
 * Connect to MongoDB Atlas.
 * Connection string comes from MONGODB_URI in server/.env
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is missing in server/.env');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
    });
    isConnected = true;
    console.log('✅  MongoDB Atlas connected successfully.');
    return true;
  } catch (err) {
    console.error('⚠️  MongoDB Atlas Connection Warning:', err.message);
    if (err.message.includes('bad auth')) {
      console.error('\n🔑  Atlas Authentication Notice:');
      console.error('    The password in server/.env for user "lawangeatharva_db_users" was rejected by Atlas.');
      console.error('    Please double-check your Database User password under MongoDB Atlas -> Security -> Database Access.\n');
    } else if (err.message.includes('querySrv') || err.message.includes('ETIMEDOUT')) {
      console.error('\n🌐  Atlas Network Notice:');
      console.error('    Please ensure your current IP address is whitelisted under MongoDB Atlas -> Security -> Network Access (set to 0.0.0.0/0 for dev).\n');
    }
    return false;
  }
}

module.exports = connectDB;

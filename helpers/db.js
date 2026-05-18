const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || '';
let client = null;
let db = null;
let connected = false;

async function connectDb() {
  if (!MONGO_URI) {
    connected = false;
    return null;
  }
  if (db) return db;
  client = new MongoClient(MONGO_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 12000 });
  await client.connect();
  db = client.db();
  connected = true;
  await db.collection('app_settings').createIndex({ key: 1 }, { unique: true });
  await db.collection('messages').createIndex({ createdAt: -1 });
  return db;
}

function getDb() { return db; }
function isMongoReady() { return connected && !!db; }

module.exports = { connectDb, getDb, isMongoReady, MONGO_URI };

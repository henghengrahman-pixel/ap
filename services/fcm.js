const admin = require('firebase-admin');
const { readJson, writeJson } = require('../helpers/json-db');

let firebaseReady = false;

function initFirebase() {
  try {
    if (firebaseReady || admin.apps.length) return true;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(json)) });
      firebaseReady = true;
      console.log('Firebase Admin aktif via FIREBASE_SERVICE_ACCOUNT_BASE64');
      return true;
    }
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      firebaseReady = true;
      console.log('Firebase Admin aktif via ENV');
      return true;
    }
    console.log('Firebase Admin belum aktif. Isi ENV Firebase untuk push notification production.');
    return false;
  } catch (err) {
    console.log('Firebase init error:', err.message);
    firebaseReady = false;
    return false;
  }
}

function saveToken(token) {
  const list = readJson('fcm-tokens.json', []);
  if (!list.includes(token)) {
    list.push(token);
    writeJson('fcm-tokens.json', list.slice(-5000));
  }
  return true;
}

async function subscribeTopic(token, topic = 'all') {
  if (!initFirebase()) return false;
  try {
    await admin.messaging().subscribeToTopic([token], topic);
    return true;
  } catch (err) {
    console.log('FCM subscribe error:', err.message);
    return false;
  }
}

async function sendBroadcast(title, body, url = '/') {
  const tokens = readJson('fcm-tokens.json', []);
  if (!initFirebase() || !tokens.length) {
    console.log('Push skipped:', title, body);
    return { sent: 0, skipped: true };
  }
  const message = {
    notification: { title: String(title).slice(0, 80), body: String(body).slice(0, 180) },
    data: { url: url || '/' },
    tokens
  };
  try {
    const result = await admin.messaging().sendEachForMulticast(message);
    return { sent: result.successCount, failed: result.failureCount };
  } catch (err) {
    console.log('FCM broadcast error:', err.message);
    return { sent: 0, error: err.message };
  }
}

module.exports = { initFirebase, saveToken, subscribeTopic, sendBroadcast };

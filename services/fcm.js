const admin = require('firebase-admin');

let initialized = false;

function initFirebase() {

  try {

    if (initialized) return;

    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('FIREBASE_SERVICE_ACCOUNT belum ada');
      return;
    }

    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    initialized = true;

    console.log('Firebase siap');

  } catch (err) {

    console.log('Firebase init error:', err.message);

  }

}

async function sendBroadcast(title, body, link = '/') {

  try {

    if (!initialized) {
      console.log('Firebase belum initialized');
      return false;
    }

    const message = {
      topic: 'all',

      notification: {
        title,
        body
      },

      webpush: {
        fcmOptions: {
          link
        },

        notification: {
          title,
          body,
          icon: '/uploads/icon-192.png',
          badge: '/uploads/icon-192.png'
        }
      }
    };

    const response = await admin
      .messaging()
      .send(message);

    console.log('NOTIF TERKIRIM:', response);

    return true;

  } catch (err) {

    console.log('SEND ERROR:', err.message);

    return false;

  }

}

module.exports = {
  initFirebase,
  sendBroadcast
};

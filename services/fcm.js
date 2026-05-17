const admin = require('firebase-admin');
      process.env.FIREBASE_SERVICE_ACCOUNT
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    firebaseReady = true;

    console.log('Firebase connected');

  } catch (err) {
    console.log('Firebase error:', err.message);
  }
}

async function sendBroadcast(title, body, url = '/') {

  try {

    if (!firebaseReady) {
      console.log('Firebase belum aktif');
      return false;
    }

    const message = {
      topic: 'all',
      notification: {
        title,
        body
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/uploads/icon-192.png',
          badge: '/uploads/icon-192.png'
        },
        fcmOptions: {
          link: url
        }
      }
    };

    const response = await admin.messaging().send(message);

    console.log('NOTIF TERKIRIM:', response);

    return true;

  } catch (err) {

    console.log('SEND NOTIF ERROR:', err.message);

    return false;

  }
}

module.exports = {
  initFirebase,
  sendBroadcast
};

const admin = require('firebase-admin');

let firebaseReady = false;

/*
|--------------------------------------------------------------------------
| INIT FIREBASE
|--------------------------------------------------------------------------
*/

function initFirebase() {

  try {

    if (firebaseReady) {
      return;
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {

      console.log(
        'FIREBASE_SERVICE_ACCOUNT BELUM ADA'
      );

      return;

    }

    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT
    );

    if (!admin.apps.length) {

      admin.initializeApp({

        credential:
          admin.credential.cert(
            serviceAccount
          )

      });

    }

    firebaseReady = true;

    console.log(
      'FIREBASE CONNECTED'
    );

  } catch (err) {

    console.log(
      'FIREBASE INIT ERROR:',
      err.message
    );

  }

}

/*
|--------------------------------------------------------------------------
| SEND BROADCAST
|--------------------------------------------------------------------------
*/

async function sendBroadcast(
  title,
  body,
  link = '/'
) {

  try {

    if (!firebaseReady) {

      console.log(
        'FIREBASE BELUM READY'
      );

      return false;

    }

    const message = {

      topic: 'all',

      notification: {
        title,
        body
      },

      webpush: {

        headers: {
          Urgency: 'high'
        },

        notification: {

          title,
          body,

          requireInteraction: true,

          icon:
            '/uploads/icon-192.png',

          badge:
            '/uploads/icon-192.png'

        },

        fcmOptions: {
          link
        }

      }

    };

    const response =
      await admin
        .messaging()
        .send(message);

    console.log(
      'NOTIF BERHASIL:',
      response
    );

    return true;

  } catch (err) {

    console.log(
      'SEND NOTIF ERROR:',
      err.message
    );

    return false;

  }

}

/*
|--------------------------------------------------------------------------
| SEND TOKEN
|--------------------------------------------------------------------------
*/

async function sendToToken(
  token,
  title,
  body,
  link = '/'
) {

  try {

    if (!firebaseReady) {
      return false;
    }

    const message = {

      token,

      notification: {
        title,
        body
      },

      webpush: {

        notification: {

          title,
          body,

          icon:
            '/uploads/icon-192.png',

          badge:
            '/uploads/icon-192.png'

        },

        fcmOptions: {
          link
        }

      }

    };

    const response =
      await admin
        .messaging()
        .send(message);

    console.log(
      'TOKEN NOTIF:',
      response
    );

    return true;

  } catch (err) {

    console.log(
      'TOKEN ERROR:',
      err.message
    );

    return false;

  }

}

module.exports = {

  initFirebase,

  sendBroadcast,

  sendToToken

};

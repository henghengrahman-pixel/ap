
const admin = require('firebase-admin');

function initFirebase(){
  try{
    if(process.env.FIREBASE_SERVICE_ACCOUNT){
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  }catch(err){
    console.log('Firebase optional:', err.message);
  }
}

async function sendBroadcast(title, body){
  console.log('Broadcast:', title, body);
}

module.exports = {initFirebase, sendBroadcast};

async function sendBroadcast(title, body) {
  console.log('Push notification disabled. Internal inbox is active:', title, body);
  return true;
}
function initFirebase() {
  console.log('Firebase disabled. Using internal inbox messages.');
}
module.exports = { initFirebase, sendBroadcast };

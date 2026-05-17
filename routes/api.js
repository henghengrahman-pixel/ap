
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const FILE = path.join(process.cwd(), 'data', 'messages.json');

function readMessages() {
  try {
    if (!fs.existsSync(FILE)) {
      fs.writeFileSync(FILE, '[]');
    }
    return JSON.parse(fs.readFileSync(FILE));
  } catch {
    return [];
  }
}

router.get('/messages', (req, res) => {
  return res.json({
    success: true,
    messages: readMessages()
  });
});

module.exports = router;

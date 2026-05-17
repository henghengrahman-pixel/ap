require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const webRoutes = require('./routes/web');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const { initFirebase } = require('./services/fcm');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

global.io = io;

initFirebase();

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(expressLayouts);

app.set('layout', 'layouts/main');

app.use(cors());

app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

app.use(express.json({
  limit: '50mb'
}));

app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'omtogel',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(express.static(PUBLIC_DIR));

app.use((req, res, next) => {
  res.locals.baseUrl = process.env.BASE_URL || '';
  next();
});

io.on('connection', (socket) => {
  console.log('USER CONNECTED');
});

app.use('/api', apiRoutes);
app.use('/', webRoutes);
app.use('/itsiregar8008', adminRoutes);

app.use((req, res) => {

  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: 'API NOT FOUND'
    });
  }

  return res.status(404).render('simple', {
    layout: 'layouts/main',
    title: '404 PAGE'
  });

});

app.use((err, req, res, next) => {

  console.error(err);

  return res.status(500).send(`
    <div style="
      background:#050505;
      color:#fff;
      height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      flex-direction:column;
      font-family:Arial;
    ">
      <h1>SERVER ERROR</h1>
      <p>${err.message}</p>
    </div>
  `);

});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log('RUNNING ON ' + PORT);
});

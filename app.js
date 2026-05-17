require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cors = require('cors');
const http = require('http');
const compression = require('compression');
const helmet = require('helmet');

const { Server } = require('socket.io');

const webRoutes = require('./routes/web');
const adminRoutes = require('./routes/admin');

const {
  initFirebase
} = require('./services/fcm');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

global.io = io;

/*
|--------------------------------------------------------------------------
| FIREBASE INIT
|--------------------------------------------------------------------------
*/

initFirebase();

/*
|--------------------------------------------------------------------------
| PATH
|--------------------------------------------------------------------------
*/

const ROOT_DIR = process.cwd();

const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

const UPLOAD_DIR = path.join(PUBLIC_DIR, 'uploads');

const DATA_DIR = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : path.join(ROOT_DIR, 'data');

/*
|--------------------------------------------------------------------------
| CREATE DIRECTORY
|--------------------------------------------------------------------------
*/

[
  PUBLIC_DIR,
  UPLOAD_DIR,
  DATA_DIR
].forEach((dir) => {

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true
    });
  }

});

/*
|--------------------------------------------------------------------------
| VIEW ENGINE
|--------------------------------------------------------------------------
*/

app.set('view engine', 'ejs');

app.set(
  'views',
  path.join(ROOT_DIR, 'views')
);

app.use(expressLayouts);

app.set(
  'layout',
  'layouts/main'
);

/*
|--------------------------------------------------------------------------
| SECURITY
|--------------------------------------------------------------------------
*/

app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(compression());

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

app.use(express.json({
  limit: '50mb'
}));

app.use(methodOverride('_method'));

/*
|--------------------------------------------------------------------------
| SESSION
|--------------------------------------------------------------------------
*/

app.set('trust proxy', 1);

app.use(session({

  name: 'omtogel.sid',

  secret:
    process.env.SESSION_SECRET ||
    'omtogel_super_secret',

  resave: false,

  saveUninitialized: false,

  cookie: {

    secure:
      process.env.NODE_ENV === 'production',

    httpOnly: true,

    sameSite: 'lax',

    maxAge:
      1000 * 60 * 60 * 24 * 7

  }

}));

/*
|--------------------------------------------------------------------------
| STATIC
|--------------------------------------------------------------------------
*/

app.use(express.static(PUBLIC_DIR, {

  maxAge: '7d',

  etag: true,

  index: false

}));

/*
|--------------------------------------------------------------------------
| GLOBAL
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {

  res.locals.baseUrl =
    process.env.BASE_URL || '';

  res.locals.siteName =
    process.env.SITE_NAME || 'OMTOGEL';

  next();

});

/*
|--------------------------------------------------------------------------
| SOCKET
|--------------------------------------------------------------------------
*/

io.on('connection', (socket) => {

  console.log(
    'SOCKET CONNECTED:',
    socket.id
  );

  socket.on('disconnect', () => {

    console.log(
      'SOCKET DISCONNECTED:',
      socket.id
    );

  });

});

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

app.get('/ping', (req, res) => {
  return res.send('OK');
});

app.use('/', webRoutes);

app.use(
  '/itsiregar8008',
  adminRoutes
);

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use((req, res) => {

  if (
    req.originalUrl.startsWith('/api')
  ) {

    return res.status(404).json({
      success: false,
      message: 'API NOT FOUND'
    });

  }

  return res.status(404).render(
    'simple',
    {
      layout: 'layouts/main',
      title: '404 PAGE'
    }
  );

});

/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use((err, req, res, next) => {

  console.error(
    'SERVER ERROR:',
    err
  );

  return res.status(500).send(`
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SERVER ERROR</title>

<style>

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  background:#050505;
  color:#fff;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:Arial,sans-serif;
  padding:20px;
}

.error-box{
  width:100%;
  max-width:700px;
  background:#111;
  border:1px solid #222;
  border-radius:20px;
  padding:40px;
  text-align:center;
}

.error-box h1{
  font-size:40px;
  margin-bottom:20px;
  color:#ff4d4d;
}

.error-box p{
  font-size:16px;
  line-height:1.7;
  color:#ccc;
  word-break:break-word;
}

</style>

</head>
<body>

<div class="error-box">

<h1>SERVER ERROR</h1>

<p>${err.message}</p>

</div>

</body>
</html>
  `);

});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const PORT =
  process.env.PORT || 8080;

server.listen(PORT, () => {

  console.log(`
===================================
 OMTOGEL SERVER RUNNING
 PORT : ${PORT}
 MODE : ${process.env.NODE_ENV || 'development'}
===================================
  `);

});

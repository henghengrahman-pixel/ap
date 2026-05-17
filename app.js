require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const session = require('express-session');
const MongoStore = require('connect-mongo');

const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cors = require('cors');
const http = require('http');
const compression = require('compression');
const helmet = require('helmet');

const { Server } = require('socket.io');

const webRoutes = require('./routes/web');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const { DATA_DIR } = require('./helpers/json-db');

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

global.io = io;

/* =========================
   ROOT PATH
========================= */

const ROOT_DIR = process.cwd();

const PUBLIC_DIR =
  path.join(ROOT_DIR, 'public');

const UPLOAD_DIR =
  path.join(PUBLIC_DIR, 'uploads');

/* =========================
   CREATE FOLDER
========================= */

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

/* =========================
   VIEW ENGINE
========================= */

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

/* =========================
   SECURITY
========================= */

app.disable('x-powered-by');

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(compression());

app.use(cors());

/* =========================
   BODY PARSER
========================= */

app.use(express.urlencoded({
  extended: true,
  limit: '50mb'
}));

app.use(express.json({
  limit: '50mb'
}));

app.use(
  methodOverride('_method')
);

/* =========================
   SESSION FIX PRODUCTION
========================= */

app.use(session({

  name: 'omtogel.sid',

  secret:
    process.env.SESSION_SECRET ||
    'omtogel_super_secret_change_me',

  resave: false,

  saveUninitialized: false,

  store: MongoStore.create({

    mongoUrl:
      process.env.MONGO_URL,

    ttl:
      60 * 60 * 24 * 7

  }),

  cookie: {

    secure:
      process.env.NODE_ENV === 'production',

    httpOnly: true,

    sameSite: 'lax',

    maxAge:
      1000 * 60 * 60 * 24 * 7

  }

}));

/* =========================
   STATIC FILE
========================= */

app.use(express.static(
  PUBLIC_DIR,
  {
    maxAge: '3d',
    etag: true,
    index: false
  }
));

/* =========================
   GLOBAL VARIABLE
========================= */

app.use((req, res, next) => {

  res.locals.baseUrl =
    process.env.BASE_URL ||
    `${req.protocol}://${req.get('host')}`;

  next();

});

/* =========================
   SOCKET IO
========================= */

io.on('connection', (socket) => {

  console.log(
    'SOCKET CONNECTED:',
    socket.id
  );

});

/* =========================
   ROUTE
========================= */

app.get('/ping', (req, res) => {

  return res.send('OK');

});

app.use('/api', apiRoutes);

app.use('/', webRoutes);

app.use(
  '/itsiregar8008',
  adminRoutes
);

/* =========================
   404
========================= */

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
      title: '404 PAGE',
      message:
        'Halaman tidak ditemukan.'
    }
  );

});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {

  console.error(
    'SERVER ERROR:',
    err
  );

  return res.status(500).send(`
<!doctype html>
<html>
<head>

<meta charset="utf-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1"
>

<title>SERVER ERROR</title>

<style>

body{

margin:0;
background:#050505;
color:#fff;

min-height:100vh;

display:grid;
place-items:center;

font-family:Arial;

padding:20px;

}

.box{

max-width:760px;

background:#111;

border:1px solid #333;

border-radius:22px;

padding:28px;

text-align:center;

}

h1{

color:#ff4d4d;

}

</style>

</head>

<body>

<div class="box">

<h1>SERVER ERROR</h1>

<p>
${String(
  err.message ||
  'Unknown error'
)}
</p>

</div>

</body>
</html>
`);

});

/* =========================
   START SERVER
========================= */

const PORT =
  process.env.PORT || 8080;

server.listen(PORT, () => {

  console.log(
    `OMTOGEL SERVER RUNNING ON ${PORT}`
  );

});

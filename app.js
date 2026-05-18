require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cors = require('cors');
const http = require('http');
const compression = require('compression');
const helmet = require('helmet');
const { Server } = require('socket.io');
const csurf = require('csurf');

const webRoutes = require('./routes/web');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');

const {
  DATA_DIR,
  ensureDir
} = require('./helpers/json-db');

const {
  apiLimiter
} = require('./middleware/security');

const {
  initFirebase
} = require('./services/fcm');

const app = express();

const server =
  http.createServer(app);

const isProduction =
  process.env.NODE_ENV === 'production';

/* =========================================
   PATH
========================================= */

const ROOT_DIR =
  process.cwd();

const PUBLIC_DIR =
  path.join(ROOT_DIR, 'public');

const UPLOAD_DIR =
  path.join(PUBLIC_DIR, 'uploads');

[
  PUBLIC_DIR,
  UPLOAD_DIR,
  DATA_DIR
].forEach(ensureDir);

/* =========================================
   SOCKET
========================================= */

const io = new Server(server, {

  cors: {

    origin:
      process.env.SOCKET_ORIGIN || '*',

    credentials:true

  }

});

global.io = io;

/* =========================================
   VIEW ENGINE
========================================= */

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

app.disable('x-powered-by');

app.set('trust proxy', 1);

/* =========================================
   SECURITY
========================================= */

app.use(

  helmet({

    contentSecurityPolicy:false,

    crossOriginEmbedderPolicy:false,

    crossOriginOpenerPolicy:false,

    crossOriginResourcePolicy:{
      policy:'cross-origin'
    },

    frameguard:false

  })

);

/* =========================================
   HEADER
========================================= */

app.use((req,res,next)=>{

  res.removeHeader('X-Frame-Options');

  res.setHeader(
    'Permissions-Policy',
    'interest-cohort=()'
  );

  res.setHeader(
    'Access-Control-Allow-Credentials',
    'true'
  );

  res.setHeader(
    'Cache-Control',

    req.path.startsWith('/api')

      ? 'no-store'

      : 'no-cache'

  );

  next();

});

/* =========================================
   PERFORMANCE
========================================= */

app.use(compression());

/* =========================================
   CORS
========================================= */

app.use(cors({

  origin:true,

  credentials:true

}));

/* =========================================
   BODY
========================================= */

app.use(express.urlencoded({

  extended:true,

  limit:'50mb'

}));

app.use(express.json({

  limit:'50mb'

}));

app.use(methodOverride('_method'));

/* =========================================
   SESSION
========================================= */

const sessionOptions = {

  name:'omtogel.sid',

  secret:
    process.env.SESSION_SECRET ||
    'omtogel_super_secure_session_2026',

  resave:false,

  saveUninitialized:false,

  rolling:true,

  proxy:true,

  cookie:{

    secure:isProduction,

    httpOnly:true,

    sameSite:'lax',

    maxAge:
      1000 *
      60 *
      60 *
      24 *
      7

  }

};

/* =========================================
   MONGO STORE
========================================= */

if(process.env.MONGO_URI){

  sessionOptions.store =
    MongoStore.create({

      mongoUrl:
        process.env.MONGO_URI,

      ttl:
        60 *
        60 *
        24 *
        7,

      autoRemove:'native'

    });

}else if(isProduction){

  console.warn(`
==================================================
WARNING:
MONGO_URI BELUM DIISI
SESSION MASIH MEMORYSTORE
==================================================
`);

}

app.use(
  session(sessionOptions)
);

/* =========================================
   CSRF
========================================= */

const csrfProtection = csurf({

  cookie:false,

  ignoreMethods:[
    'GET',
    'HEAD',
    'OPTIONS'
  ]

});

function shouldBypassCsrf(req){

  const method =
    String(req.method || 'GET')
      .toUpperCase();

  /* GET SAFE */

  if(
    ['GET','HEAD','OPTIONS']
    .includes(method)
  ){

    return true;

  }

  /* ADMIN WAJIB CSRF */

  if(
    req.path.startsWith('/itsiregar8008')
  ){

    return false;

  }

  /* API PUBLIC */

  const publicApiRoutes = [

    '/api',

    '/track-click',

    '/push/token',

    '/socket.io'

  ];

  return publicApiRoutes.some(route =>

    req.path === route ||

    req.path.startsWith(
      `${route}/`
    )

  );

}

app.use((req,res,next)=>{

  if(
    shouldBypassCsrf(req)
  ){

    return next();

  }

  return csrfProtection(
    req,
    res,
    next
  );

});

/* =========================================
   LOCALS
========================================= */

app.use((req,res,next)=>{

  res.locals.baseUrl =
    process.env.BASE_URL ||
    `${req.protocol}://${req.get('host')}`;

  res.locals.csrfToken =

    typeof req.csrfToken === 'function'
      ? req.csrfToken()
      : '';

  next();

});

/* =========================================
   STATIC
========================================= */

app.use(

  express.static(PUBLIC_DIR, {

    maxAge:
      isProduction
        ? '1d'
        : 0,

    etag:true,

    index:false,

    setHeaders:(res,filePath)=>{

      const normalized =
        filePath.replace(/\\/g,'/');

      if(

        normalized.endsWith('/service-worker.js') ||

        normalized.endsWith('/firebase-messaging-sw.js') ||

        normalized.endsWith('/manifest.json')

      ){

        res.setHeader(

          'Cache-Control',

          'no-store, no-cache, must-revalidate, proxy-revalidate'

        );

      }

    }

  })

);

/* =========================================
   SOCKET
========================================= */

io.on('connection',(socket)=>{

  console.log(
    'SOCKET CONNECTED:',
    socket.id
  );

});

/* =========================================
   FIREBASE
========================================= */

initFirebase();

/* =========================================
   ROUTES
========================================= */

app.get('/ping',(req,res)=>{

  return res.send('OK');

});

app.use(
  '/api',
  apiLimiter,
  apiRoutes
);

app.use('/',webRoutes);

app.use(
  '/itsiregar8008',
  adminRoutes
);

/* =========================================
   404
========================================= */

app.use((req,res)=>{

  if(req.originalUrl.startsWith('/api')){

    return res.status(404).json({

      success:false,

      message:'API NOT FOUND'

    });

  }

  return res.status(404).render(

    'simple',

    {

      layout:'layouts/main',

      title:'404 PAGE',

      message:'Halaman tidak ditemukan.'

    }

  );

});

/* =========================================
   ERROR
========================================= */

app.use((err, req, res, next) => {

  /* CSRF */

  if(
    err &&
    err.code === 'EBADCSRFTOKEN'
  ){

    /* API */

    if(
      req.originalUrl.startsWith('/api')
    ){

      return res.status(403).json({

        success:false,

        message:
          'CSRF token tidak valid. Refresh halaman lalu coba lagi.'

      });

    }

    /* ADMIN */

    if(
      req.originalUrl.startsWith('/itsiregar8008')
    ){

      req.session.destroy(()=>{});

      return res.redirect(
        '/itsiregar8008'
      );

    }

    /* USER */

    return res.redirect('/');

  }

  console.error(
    'SERVER ERROR:',
    err
  );

  return res.status(500).send(`
<!doctype html>

<html lang="id">

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
font-family:Arial,sans-serif;
padding:20px;
}

.box{
width:100%;
max-width:760px;
padding:30px;
border-radius:28px;
background:
linear-gradient(
180deg,
#161616,
#090909
);
border:1px solid rgba(255,255,255,.08);
text-align:center;
box-shadow:
0 10px 34px rgba(0,0,0,.45);
}

h1{
margin:0 0 14px;
font-size:32px;
font-weight:900;
color:#ff4d4d;
}

p{
margin:0;
line-height:1.8;
font-size:15px;
color:#d1d5db;
word-break:break-word;
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

/* =========================================
   SERVER
========================================= */

const PORT =
  process.env.PORT || 8080;

server.listen(PORT,()=>{

  console.log(`
==================================================
OMTOGEL PREMIUM APP RUNNING
PORT : ${PORT}
MODE : ${process.env.NODE_ENV || 'development'}
==================================================
`);

});

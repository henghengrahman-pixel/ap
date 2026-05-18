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
    'omtogel_super_secret_change_me',

  resave:false,

  saveUninitialized:false,

  rolling:true,

  proxy:true,

  cookie:{

    secure:isProduction,

    httpOnly:true,

    sameSite:'none',

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

      autoRemove:'native',

      crypto:
        process.env.MONGO_STORE_SECRET
          ? {
              secret:
                process.env.MONGO_STORE_SECRET
            }
          : undefined

    });

}else if(isProduction){

  console.warn(`
==================================================
WARNING:
MONGO_URI BELUM DIISI
SESSION MASIH MEMORYSTORE
LOGIN BISA MEMBAL DI RAILWAY
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

app.use((req,res,next)=>{

  const bypassRoutes = [

    '/login',
    '/register',
    '/signin',
    '/signup',
    '/daftar',

    '/api',

    '/track-click',

    '/push/token'

  ];

  const bypass =
    bypassRoutes.some(route =>
      req.path.startsWith(route)
    );

  if(bypass){

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

  res.locals.isApp =

    req.headers['x-requested-with']
      === 'com.omtogel.app';

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

app.use((err,req,res,next)=>{

  /* CSRF */

  if(err.code === 'EBADCSRFTOKEN'){

    /* API */

    if(req.originalUrl.startsWith('/api')){

      return res.status(403).json({

        success:false,

        message:'CSRF token tidak valid.'

      });

    }

    /* ADMIN */

    if(
      req.originalUrl.startsWith('/itsiregar8008')
    ){

      return res.status(403).send(`
<!doctype html>

<html lang="id">

<head>

<meta charset="utf-8">

<meta
name="viewport"
content="width=device-width,initial-scale=1"
>

<title>SESSION EXPIRED</title>

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
width:100%;
max-width:520px;
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
font-size:30px;
font-weight:900;
color:#ff4d4d;
}

p{
margin:0 0 22px;
line-height:1.8;
font-size:15px;
color:#d1d5db;
}

a{
display:inline-flex;
align-items:center;
justify-content:center;
height:52px;
padding:0 24px;
border-radius:16px;
background:
linear-gradient(
180deg,
#ffffff,
#bcbcbc
);
color:#050505;
font-weight:900;
text-decoration:none;
}

</style>

</head>

<body>

<div class="box">

<h1>SESSION EXPIRED</h1>

<p>
Session admin berubah atau expired.
Refresh halaman admin lalu coba save kembali.
</p>

<a href="javascript:location.reload()">
REFRESH HALAMAN
</a>

</div>

</body>

</html>
`);

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
font-family:Arial;
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

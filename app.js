
require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require('method-override');
const cors = require('cors');
const http = require('http');
const {Server} = require('socket.io');

const webRoutes = require('./routes/web');
const adminRoutes = require('./routes/admin');
const {initFirebase} = require('./services/fcm');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

initFirebase();

app.set('view engine','ejs');
app.set('views', path.join(process.cwd(),'views'));

app.use(expressLayouts);
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'omtogel',
  resave:false,
  saveUninitialized:false
}));

app.use(express.static(path.join(process.cwd(),'public')));

app.use('/', webRoutes);
app.use('/itsiregar8008', adminRoutes);

app.use((req,res)=>{
  res.status(404).send('404');
});

const PORT = process.env.PORT || 8080;

server.listen(PORT,()=>{
  console.log('RUNNING ON '+PORT);
});

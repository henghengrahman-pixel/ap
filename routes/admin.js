
const express = require('express');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const {readJson,writeJson} = require('../helpers/json-db');
const {sendBroadcast} = require('../services/fcm');

const router = express.Router();

const storage = multer.diskStorage({
 destination:(req,file,cb)=>cb(null,path.join(process.cwd(),'public/uploads')),
 filename:(req,file,cb)=>cb(null,Date.now()+'-'+file.originalname)
});

const upload = multer({storage});

router.get('/login',(req,res)=>{
  res.render('admin/login',{layout:false,error:null});
});

router.post('/login',(req,res)=>{
  const {username,password} = req.body;

  if(username === process.env.ADMIN_ID && password === process.env.ADMIN_PASSWORD){
    req.session.admin = true;
    return res.redirect('/itsiregar8008');
  }

  return res.render('admin/login',{layout:false,error:'Login gagal'});
});

router.get('/logout',(req,res)=>{
  req.session.destroy(()=>{
    res.redirect('/itsiregar8008/login');
  });
});

router.get('/',auth,(req,res)=>{
  res.render('admin/dashboard',{
    layout:'layouts/main-admin',
    settings: readJson('settings.json',{})
  });
});

router.post('/settings',auth,upload.fields([
  {name:'logo'},
  {name:'background'}
]),(req,res)=>{
  const old = readJson('settings.json',{});
  const data = {
    ...old,
    ...req.body
  };

  if(req.files.logo){
    data.logoUrl = '/uploads/' + req.files.logo[0].filename;
  }

  if(req.files.background){
    data.backgroundUrl = '/uploads/' + req.files.background[0].filename;
  }

  writeJson('settings.json',data);
  res.redirect('/itsiregar8008');
});

router.post('/broadcast',auth, async(req,res)=>{
  await sendBroadcast(req.body.title, req.body.message);
  res.redirect('/itsiregar8008');
});

module.exports = router;

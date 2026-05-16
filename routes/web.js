const express = require('express');

const router = express.Router();

const {
  readJson
} = require('../helpers/json-db');


router.get('/', (req, res) => {

  const settings = readJson(
    'settings.json',
    {
      siteName: 'OMTOGEL',
      footer: 'OMTOGEL OFFICIAL',
      ticker: 'WELCOME TO OMTOGEL'
    }
  );

  const sliders = readJson(
    'sliders.json',
    []
  );

  const popup = readJson(
    'popup.json',
    {}
  );

  const menus = readJson(
    'menus.json',
    [
      {
        title: 'RTP SLOT',
        url: '/rtp'
      },
      {
        title: 'PROMOSI',
        url: '#'
      },
      {
        title: 'LOGIN',
        url: '/login'
      },
      {
        title: 'BUKTI JP',
        url: '#'
      },
      {
        title: 'DAFTAR',
        url: '/daftar'
      },
      {
        title: 'PREDIKSI TOGEL',
        url: '/prediksi-togel'
      },
      {
        title: 'PREDIKSI BOLA',
        url: '/prediksi-bola'
      },
      {
        title: 'LINK ALTERNATIF',
        url: '#'
      },
      {
        title: 'WHATSAPP',
        url: '/whatsapp'
      },
      {
        title: 'LIVECHAT',
        url: '/livechat'
      }
    ]
  );

  res.render('home', {
    layout: 'layouts/main',
    settings,
    sliders,
    popup,
    menus
  });

});


router.get('/login', (req, res) => {

  const settings = readJson(
    'settings.json',
    {}
  );

  return res.redirect(
    settings.loginUrl || '#'
  );

});


router.get('/daftar', (req, res) => {

  const settings = readJson(
    'settings.json',
    {}
  );

  return res.redirect(
    settings.registerUrl || '#'
  );

});


router.get('/whatsapp', (req, res) => {

  const settings = readJson(
    'settings.json',
    {}
  );

  return res.redirect(
    settings.whatsappUrl || '#'
  );

});


router.get('/livechat', (req, res) => {

  const settings = readJson(
    'settings.json',
    {}
  );

  return res.redirect(
    settings.livechatUrl || '#'
  );

});


router.get('/rtp', (req, res) => {

  res.render('simple', {
    layout: 'layouts/main',
    title: 'RTP SLOT'
  });

});


router.get('/prediksi-bola', (req, res) => {

  res.render('simple', {
    layout: 'layouts/main',
    title: 'PREDIKSI BOLA'
  });

});


router.get('/prediksi-togel', (req, res) => {

  res.render('simple', {
    layout: 'layouts/main',
    title: 'PREDIKSI TOGEL'
  });

});


module.exports = router;

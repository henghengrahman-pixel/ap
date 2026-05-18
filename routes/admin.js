const express = require('express');
const fs = require('fs');
const path = require('path');

const auth = require('../middleware/auth');

const {
  getSettings,
  saveSettings,
  cleanText,
  cleanUrl,
  toBool,
  toInt,
  readCollection
} = require('../helpers/settings');

const router = express.Router();

const DATA_DIR =
  process.env.DATA_DIR ||
  path.join(process.cwd(), 'data');

const MESSAGE_FILE = path.join(
  DATA_DIR,
  'messages.json'
);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(MESSAGE_FILE)) {
  fs.writeFileSync(
    MESSAGE_FILE,
    JSON.stringify([], null, 2)
  );
}

function getMessages() {

  try {

    const raw = fs.readFileSync(
      MESSAGE_FILE,
      'utf8'
    );

    return JSON.parse(raw || '[]');

  } catch (err) {

    console.error('GET MESSAGE ERROR', err);

    return [];

  }

}

function saveMessages(data = []) {

  try {

    fs.writeFileSync(
      MESSAGE_FILE,
      JSON.stringify(data, null, 2)
    );

  } catch (err) {

    console.error('SAVE MESSAGE ERROR', err);

  }

}

router.get('/login', async (req, res, next) => {

  try {

    return res.render('admin/login', {
      layout: false,
      error: null,
      settings: await getSettings()
    });

  } catch (err) {

    next(err);

  }

});

router.post('/login', async (req, res, next) => {

  try {

    const username = cleanText(
      req.body.username
    );

    const password = cleanText(
      req.body.password
    );

    if (
      username === process.env.ADMIN_ID &&
      password === process.env.ADMIN_PASSWORD
    ) {

      req.session.admin = true;

      return req.session.save(() => {

        return res.redirect(
          '/PINKTIGER8008'
        );

      });

    }

    return res.status(401).render(
      'admin/login',
      {
        layout: false,
        error: 'ID atau password salah.',
        settings: await getSettings()
      }
    );

  } catch (err) {

    next(err);

  }

});

router.get('/logout', (req, res) => {

  return req.session.destroy(() => {

    return res.redirect(
      '/PINKTIGER8008/login'
    );

  });

});

router.get('/', auth, async (req, res, next) => {

  try {

    const settings =
      await getSettings();

    const messages =
      getMessages()
      .sort((a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );

    return res.render(
      'admin/settings',
      {
        layout: 'layouts/main-admin',
        settings,
        messages
      }
    );

  } catch (err) {

    next(err);

  }

});

router.post('/settings', auth, async (req, res, next) => {

  try {

    const old =
      await getSettings();

    const sliders =
      readCollection(
        'slide',
        req.body,
        12,
        (n) => ({

          id:
            cleanText(
              req.body[`slide${n}Id`]
            ) ||
            `slide-${Date.now()}-${n}`,

          title:
            cleanText(
              req.body[`slide${n}Title`]
            ) ||
            `Slide ${n}`,

          imageUrl:
            cleanUrl(
              req.body[`slide${n}ImageUrl`]
            ),

          link:
            cleanUrl(
              req.body[`slide${n}Link`],
              '#'
            ),

          order:
            toInt(
              req.body[`slide${n}Order`],
              n
            ),

          active:
            toBool(
              req.body[`slide${n}Active`]
            )

        })
      ).filter(item =>
        item.title ||
        item.imageUrl
      );

    const buttons =
      readCollection(
        'button',
        req.body,
        14,
        (n) => ({

          id:
            cleanText(
              req.body[`button${n}Id`]
            ) ||
            `button-${Date.now()}-${n}`,

          title:
            cleanText(
              req.body[`button${n}Title`]
            ),

          link:
            cleanUrl(
              req.body[`button${n}Link`],
              '#'
            ),

          icon:
            cleanText(
              req.body[`button${n}Icon`]
            ),

          color:
            cleanText(
              req.body[`button${n}Color`],
              'silver'
            ),

          order:
            toInt(
              req.body[`button${n}Order`],
              n
            ),

          active:
            toBool(
              req.body[`button${n}Active`]
            )

        })
      ).filter(item =>
        item.title
      );

    const bottomNav =
      readCollection(
        'nav',
        req.body,
        8,
        (n) => ({

          id:
            cleanText(
              req.body[`nav${n}Id`]
            ) ||
            `nav-${Date.now()}-${n}`,

          title:
            cleanText(
              req.body[`nav${n}Title`]
            ),

          icon:
            cleanText(
              req.body[`nav${n}Icon`],
              'fa-solid fa-house'
            ),

          link:
            cleanUrl(
              req.body[`nav${n}Link`],
              '#'
            ),

          colorActive:
            cleanText(
              req.body[`nav${n}ColorActive`],
              '#d21717'
            ),

          order:
            toInt(
              req.body[`nav${n}Order`],
              n
            ),

          active:
            toBool(
              req.body[`nav${n}Active`]
            )

        })
      ).filter(item =>
        item.title
      );

    const data = {

      ...old,

      siteName:
        cleanText(
          req.body.siteName,
          old.siteName
        ),

      subtitle:
        cleanText(
          req.body.subtitle,
          old.subtitle
        ),

      siteDescription:
        cleanText(
          req.body.siteDescription,
          old.siteDescription
        ),

      siteKeywords:
        cleanText(
          req.body.siteKeywords,
          old.siteKeywords
        ),

      logoUrl:
        cleanUrl(
          req.body.logoUrl
        ),

      faviconUrl:
        cleanUrl(
          req.body.faviconUrl
        ),

      footerText:
        cleanText(
          req.body.footerText,
          old.footerText
        ),

      loaderLogoUrl:
        cleanUrl(
          req.body.loaderLogoUrl
        ),

      loaderText:
        cleanText(
          req.body.loaderText,
          old.loaderText
        ),

      backgroundMain:
        cleanUrl(
          req.body.backgroundMain
        ),

      backgroundMobile:
        cleanUrl(
          req.body.backgroundMobile
        ),

      backgroundDesktop:
        cleanUrl(
          req.body.backgroundDesktop
        ),

      backgroundLogin:
        cleanUrl(
          req.body.backgroundLogin
        ),

      backgroundPopup:
        cleanUrl(
          req.body.backgroundPopup
        ),

      backgroundFooter:
        cleanUrl(
          req.body.backgroundFooter
        ),

      backgroundNavbar:
        cleanUrl(
          req.body.backgroundNavbar
        ),

      backgroundLoading:
        cleanUrl(
          req.body.backgroundLoading
        ),

      popupImageUrl:
        cleanUrl(
          req.body.popupImageUrl
        ),

      popupLink:
        cleanUrl(
          req.body.popupLink,
          '#'
        ),

      popupTimer:
        toInt(
          req.body.popupTimer,
          1200
        ),

      popupActive:
        toBool(
          req.body.popupActive
        ),

      sliders:
        sliders.length
          ? sliders
          : old.sliders,

      buttons:
        buttons.length
          ? buttons
          : old.buttons,

      bottomNav:
        bottomNav.length
          ? bottomNav
          : old.bottomNav

    };

    await saveSettings(data);

    return res.redirect(
      '/PINKTIGER8008?saved=1'
    );

  } catch (err) {

    next(err);

  }

});

router.post('/message/add', auth, async (req, res, next) => {

  try {

    const messages =
      getMessages();

    messages.unshift({

      id:
        Date.now().toString(),

      title:
        cleanText(
          req.body.title,
          'Pesan OMTOGEL'
        ),

      category:
        cleanText(
          req.body.category,
          'INFO'
        ),

      message:
        cleanText(
          req.body.message
        ),

      imageUrl:
        cleanUrl(
          req.body.imageUrl
        ),

      link:
        cleanUrl(
          req.body.link,
          '#'
        ),

      createdAt:
        new Date().toISOString()

    });

    saveMessages(messages);

    return res.redirect(
      '/PINKTIGER8008#messages'
    );

  } catch (err) {

    next(err);

  }

});

router.post('/message/delete/:id', auth, async (req, res, next) => {

  try {

    const messages =
      getMessages();

    const filtered =
      messages.filter(item =>
        item.id !== req.params.id
      );

    saveMessages(filtered);

    return res.redirect(
      '/PINKTIGER8008#messages'
    );

  } catch (err) {

    next(err);

  }

});

router.post('/messages/clear', auth, async (req, res, next) => {

  try {

    saveMessages([]);

    return res.redirect(
      '/PINKTIGER8008#messages'
    );

  } catch (err) {

    next(err);

  }

});

module.exports = router;

module.exports = (req, res, next) => {

  try {

    /*
    =========================
    NO CACHE ADMIN
    =========================
    */

    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, private'
    );

    res.setHeader(
      'Pragma',
      'no-cache'
    );

    res.setHeader(
      'Expires',
      '0'
    );

    /*
    =========================
    SESSION CHECK
    =========================
    */

    if (

      req.session &&

      req.session.admin === true

    ) {

      return next();

    }

    /*
    =========================
    INVALID SESSION
    =========================
    */

    if (req.session) {

      req.session.admin = false;

    }

    return res.redirect(
      '/PINKTIGER8008/login'
    );

  } catch (err) {

    console.error(
      'AUTH ERROR'
    );

    console.error(err);

    return res.redirect(
      '/PINKTIGER8008/login'
    );

  }

};

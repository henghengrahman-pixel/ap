function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/pinktiger8008/login');
}
function redirectIfAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return res.redirect('/pinktiger8008');
  return next();
}
module.exports = { requireAdmin, redirectIfAdmin };

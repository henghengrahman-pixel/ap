const { readJson, writeJson } = require('../helpers/json-db');

const BIG_LEAGUE_KEYWORDS = ['premier league','champions league','liga indonesia','bri liga','la liga','serie a','bundesliga','europa league','eredivisie','ligue 1'];

function httpsUrl(url) { return typeof url === 'string' ? url.replace(/^http:\/\//i, 'https://') : ''; }
function pickLogo(obj, paths) {
  for (const p of paths) {
    const val = p.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
    if (val) return httpsUrl(val);
  }
  return '';
}
function normalizePrediction(match = {}) {
  const fixture = match.fixture || match;
  const teams = match.teams || {};
  const league = match.league || {};
  const home = teams.home || match.home || match.homeTeam || {};
  const away = teams.away || match.away || match.awayTeam || {};
  return {
    id: String(fixture.id || match.id || `${home.name || 'home'}-${away.name || 'away'}`),
    leagueName: league.name || match.leagueName || 'Football',
    leagueLogo: httpsUrl(league.logo || match.leagueLogo || ''),
    kickoff: fixture.date || match.kickoff || match.date || '',
    homeName: home.name || match.homeName || 'Home Team',
    awayName: away.name || match.awayName || 'Away Team',
    homeLogo: pickLogo(match, ['teams.home.logo','home.logo','homeTeam.logo','homeLogo']),
    awayLogo: pickLogo(match, ['teams.away.logo','away.logo','awayTeam.logo','awayLogo']),
    prediction: match.prediction || match.pick || 'Analisa tersedia sebelum kick-off',
    predictedScore: match.predictedScore || match.scorePrediction || '-',
    overUnder: match.overUnder || '-',
    status: fixture.status?.short || match.status || 'NS'
  };
}
function isBigLeague(item) {
  const name = String(item.leagueName || '').toLowerCase();
  return BIG_LEAGUE_KEYWORDS.some((key) => name.includes(key));
}
function getPredictions() {
  const data = readJson('predictions.json', []);
  const normalized = (Array.isArray(data) ? data : []).map(normalizePrediction);
  return normalized.filter(isBigLeague).concat(normalized.filter((x) => !isBigLeague(x))).slice(0, 24);
}
function savePredictions(items) { writeJson('predictions.json', (items || []).map(normalizePrediction)); }
module.exports = { normalizePrediction, getPredictions, savePredictions };

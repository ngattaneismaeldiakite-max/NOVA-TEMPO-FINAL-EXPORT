// Test de charge : N clients lancent une chanson en même temps (1 crédit chacun), avec un faux SunoAPI qui applique
// la vraie limite (20 requêtes / 10 s pour tout le site) et une fausse base de données.
// Le temps est accéléré (ECHELLE = 0,1 → 10 fois plus vite) : la limite devient 20 requêtes / 1 s,
// une chanson prend 12 s au lieu de 2 minutes, le navigateur interroge toutes les 0,5 s au lieu de 5 s.
// Usage : node tests/charge.js [dossier du projet] [nombre de clients]
const ROOT = process.argv[2] || require('path').resolve(__dirname, '..');
const N = Number(process.argv[3] || process.env.CLIENTS || 100);
const E = 0.1;                       // échelle de temps
const DUREE_CHANSON = 120000 * E;    // 2 minutes réelles
const FENETRE = 10000 * E;           // fenêtre de la limite Suno
const LIMITE = 20;                   // requêtes par fenêtre
const SONDAGE = 5000 * E;            // le Studio interroge toutes les 5 s
const ARRIVEE_S = Number(process.env.ARRIVEE_S || 3); // les clients arrivent étalés sur ce nombre de secondes (réelles)
const ARRIVEE = ARRIVEE_S * 1000 * E;

process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
process.env.GENIUSPAY_PUBLIC_KEY = 'pk'; process.env.GENIUSPAY_SECRET_KEY = 'sk';
process.env.SUNO_API_KEY = 'suno';

const uid = i => `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
const db = { profiles: Array.from({ length: N }, (_, i) => ({ id: uid(i), credits: 1 })), tracks: [], error_logs: [] };
let idn = 1000;
const suno = { appels: [], limites: 0, generations: 0, lectures: 0, credit: 0, taches: new Map(), pic: 0 };

function parseFilters(qs) {
  const f = [];
  for (const [k, v] of new URLSearchParams(qs)) {
    if (['select', 'limit', 'order'].includes(k)) continue;
    const [op, ...rest] = v.split('.'); const val = rest.join('.');
    f.push(row => op === 'eq' ? String(row[k]) === val : op === 'is' ? row[k] == null : op === 'lt' ? String(row[k]) < val
      : op === 'in' ? val.slice(1, -1).split(',').includes(row[k]) : true);
  }
  return row => f.every(fn => fn(row));
}
const json = (o, status = 200) => ({ ok: status < 300, status, text: async () => JSON.stringify(o), json: async () => o, arrayBuffer: async () => new ArrayBuffer(8) });

// Limite de débit de Suno : fenêtre glissante, tous appels confondus
function sunoLimite(type) {
  const t = Date.now();
  while (suno.appels.length && t - suno.appels[0] > FENETRE) suno.appels.shift();
  if (suno.appels.length >= LIMITE) { suno.limites++; return true; }
  suno.appels.push(t); suno.pic = Math.max(suno.pic, suno.appels.length);
  suno[type]++;
  return false;
}

global.fetch = async (url, opt = {}) => {
  const method = opt.method || 'GET';
  const body = opt.body && typeof opt.body === 'string' ? JSON.parse(opt.body) : opt.body;
  const u = new URL(url);
  await new Promise(r => setTimeout(r, 5 + Math.random() * 20)); // latence réseau
  if (u.pathname === '/auth/v1/user') {
    const m = /^Bearer u(\d+)$/.exec(opt.headers.Authorization || ''); return m ? json({ id: uid(Number(m[1])), email: 'x@y.ci' }) : json({}, 401);
  }
  if (u.pathname.startsWith('/rest/v1/rpc/')) {
    const fn = u.pathname.split('/').pop(); const p = db.profiles.find(x => x.id === body.p_user);
    if (fn === 'consume_credit') { if (p && p.credits >= 1) { p.credits--; return json(p.credits); } return json(null); }
    if (fn === 'refund_credit') { if (p) p.credits++; return json(p ? p.credits : null); }
  }
  if (u.pathname.startsWith('/rest/v1/')) {
    const table = u.pathname.split('/').pop(); const match = parseFilters(u.search);
    if (!db[table]) db[table] = [];
    if (method === 'GET') {
      let rows = db[table].filter(match); const order = u.searchParams.get('order');
      if (order) { const [c, d] = order.split('.'); rows = [...rows].sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : 1) * (d === 'desc' ? -1 : 1)); }
      const lim = Number(u.searchParams.get('limit')); if (lim) rows = rows.slice(0, lim);
      return json(rows.map(r => ({ ...r })));
    }
    if (method === 'POST') { const row = { id: `00000000-0000-0000-0001-${String(++idn).padStart(12, '0')}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body }; db[table].push(row); return json([row], 201); }
    if (method === 'PATCH') { const rows = db[table].filter(match); rows.forEach(r => Object.assign(r, body)); return json(rows.map(r => ({ ...r }))); }
  }
  if (u.pathname.startsWith('/storage/v1/object/')) return json({ Key: 'ok' });
  if (u.hostname === 'cdn.suno') return json({});
  if (u.hostname === 'api.sunoapi.org') {
    if (u.pathname.endsWith('/generate/credit')) { if (sunoLimite('credit')) return json({ code: 430, msg: 'call frequency too high' }); return json({ code: 200, data: 100000 }); }
    if (u.pathname.endsWith('/generate/record-info')) {
      if (sunoLimite('lectures')) return json({ code: 430, msg: 'call frequency too high' });
      const t = suno.taches.get(u.searchParams.get('taskId'));
      const fini = t && Date.now() - t.debut >= DUREE_CHANSON;
      return json({ code: 200, data: { status: fini ? 'SUCCESS' : 'PENDING', response: { sunoData: [{ audioUrl: fini ? 'https://cdn.suno/x.mp3' : '' }] } } });
    }
    if (u.pathname.endsWith('/generate')) {
      if (sunoLimite('generations')) return json({ code: 430, msg: 'call frequency too high' });
      const taskId = `task-${++idn}`; suno.taches.set(taskId, { debut: Date.now() });
      // comme le vrai Suno : un rappel (callback) quand la chanson est prête
      setTimeout(() => { require(`${ROOT}/api/songs/suno-callback`)({ method: 'POST', body: { data: { task_id: taskId } }, headers: {} }, { status() { return this; }, json() { return this; } }); }, DUREE_CHANSON + 300);
      return json({ code: 200, data: { taskId } });
    }
  }
  throw new Error('fetch inattendu ' + url);
};

// Réglages d'attente accélérés (le code les expose pour les tests)
const tracks = require(`${ROOT}/api/_lib/tracks`);
if (tracks.delais) Object.assign(tracks.delais, { intervalle: 12000 * E, avant: 20000 * E, reessai: [1200 * E, 2500 * E], priseEnCharge: 6000 * E });

const handler = p => require(`${ROOT}/api/${p}`);
async function appeler(p, method, token, query, body) {
  const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; }, setHeader() {} };
  await handler(p)({ method, body: body || {}, query: query || {}, headers: { host: 'novatempo.vercel.app', authorization: token, 'x-forwarded-for': '10.0.0.' + (token || '').length } }, res);
  return res;
}

const attendre = ms => new Promise(r => setTimeout(r, ms));
const resultats = [];
async function client(i) {
  await attendre(Math.random() * ARRIVEE);
  const t0 = Date.now(), token = `Bearer u${i}`;
  const r = { i, depart: t0, codeCreation: 0, issue: 'inconnue', mis_en_attente: false };
  const g = await appeler('songs/generate-audio', 'POST', token, {}, { lyrics: '[Couplet 1]\nBonjour Awa, joyeux anniversaire', voice: 'female', genre: 'Zouk', occasion: 'anniversaire', titre: 'Pour Awa' });
  r.codeCreation = g.code;
  if (g.code !== 200 && g.code !== 202) { r.issue = `refusé (${g.code})`; resultats.push(r); return; }
  r.mis_en_attente = g.code === 202 || !!(g.body && g.body.queued);
  const id = g.body.job_id;
  while (Date.now() - t0 < 100000 * E * 10) { // 100 s accélérées = 16 min réelles
    await attendre(SONDAGE * (0.8 + Math.random() * 0.4));
    const s = await appeler('songs/check-status', 'GET', token, { id });
    if (s.body && s.body.queued) r.mis_en_attente = true;
    if (s.body && s.body.status === 'completed') { r.issue = 'terminée'; r.duree = Date.now() - t0; break; }
    if (s.body && s.body.status === 'failed') { r.issue = 'échec (crédit rendu)'; r.duree = Date.now() - t0; break; }
  }
  if (r.issue === 'inconnue') r.issue = 'toujours en attente à la fin du test';
  resultats.push(r);
}

(async () => {
  const debut = Date.now();
  console.log(`Test de charge : ${N} clients, 1 crédit chacun, lancement en ${(ARRIVEE / 1000).toFixed(1)} s (temps accéléré ×${1 / E})`);
  await Promise.all(Array.from({ length: N }, (_, i) => client(i)));
  const compte = {}; resultats.forEach(r => { compte[r.issue] = (compte[r.issue] || 0) + 1; });
  const termines = resultats.filter(r => r.duree && r.issue === 'terminée').map(r => r.duree / E / 1000).sort((a, b) => a - b);
  const q = p => termines.length ? Math.round(termines[Math.min(termines.length - 1, Math.floor(termines.length * p))]) : 0;
  const credits = db.profiles.reduce((s, p) => s + p.credits, 0);
  const completes = db.tracks.filter(t => t.statut === 'completed').length, echecs = db.tracks.filter(t => t.statut === 'failed').length;
  const enCours = db.tracks.filter(t => t.statut === 'processing' || t.statut === 'pending').length;
  const facturesSansService = db.profiles.filter(p => p.credits === 0 && !db.tracks.some(t => t.user_id === p.id && t.statut === 'completed')).length;
  console.log(`\n=== RÉSULTAT (${((Date.now() - debut) / 1000).toFixed(0)} s de test, soit ≈ ${((Date.now() - debut) / E / 60000).toFixed(0)} min réelles) ===`);
  Object.entries(compte).forEach(([k, v]) => console.log(`  ${String(v).padStart(3)} clients : ${k}`));
  console.log(`  dont ${resultats.filter(r => r.mis_en_attente).length} ont vu « ta chanson est en attente »`);
  console.log(`  durée de création (équivalent réel) : médiane ${q(.5)} s · 90 % sous ${q(.9)} s · la plus longue ${q(.99)} s`);
  console.log(`  SunoAPI : ${suno.generations} lancements, ${suno.lectures} lectures, ${suno.limites} refus « trop d'appels » (code 430), pic ${suno.pic}/${LIMITE} requêtes dans la fenêtre`);
  console.log(`  base : ${completes} chansons terminées, ${echecs} échecs remboursés, ${enCours} encore en cours`);
  console.log(`  crédits restants chez les clients : ${credits} (attendu : ${echecs} remboursés + ${N - db.tracks.length} jamais débités)`);
  console.log(`  clients débités sans chanson ni remboursement : ${facturesSansService}`);
  const bug = completes + echecs + enCours !== db.tracks.length || suno.generations > db.tracks.length;
  console.log(bug ? '  ⚠ INCOHÉRENCE détectée (double lancement ou chanson perdue)' : '  ✔ cohérence : aucun double lancement, aucune chanson perdue');
  process.exit(0);
})();

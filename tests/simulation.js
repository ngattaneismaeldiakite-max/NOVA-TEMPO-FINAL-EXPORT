// Simulation hors-ligne des fonctions /api avec une fausse base et de fausses API externes.
process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
process.env.GENIUSPAY_PUBLIC_KEY = 'pk';
process.env.GENIUSPAY_SECRET_KEY = 'sk';
process.env.SUNO_API_KEY = 'suno';
const ROOT = process.argv[2] || require('path').resolve(__dirname, '..');

const USER = '11111111-1111-1111-1111-111111111111';
const db = { profiles: [{ id: USER, credits: 0 }], payments: [], tracks: [], error_logs: [] };
const gp = {}; // reference -> {status, amount}
process.env.TELEGRAM_BOT_TOKEN = 'tg';
process.env.TELEGRAM_CHAT_ID = '1';
const telegram = []; // messages envoyés au propriétaire
let suno = { generateFails: false, status: 'PENDING', audioUrl: null, credits: 5000, creditsKo: false, limiteRestantes: 0, recordLimite: false, lectures: 0 };
let calls = [];
let idn = 0;
const uuid = () => `00000000-0000-0000-0000-${String(++idn).padStart(12, '0')}`;

function parseFilters(qs) {
  const f = [];
  for (const [k, v] of new URLSearchParams(qs)) {
    if (['select', 'limit', 'order'].includes(k)) continue;
    const [op, ...rest] = v.split('.'); const val = rest.join('.');
    f.push(row => op === 'eq' ? String(row[k]) === val
      : op === 'is' ? row[k] == null
      : op === 'lt' ? String(row[k]) < val
      : op === 'in' ? val.slice(1, -1).split(',').includes(row[k]) : true);
  }
  return row => f.every(fn => fn(row));
}
const json = (o, status = 200) => ({ ok: status < 300, status, text: async () => JSON.stringify(o), json: async () => o, arrayBuffer: async () => new ArrayBuffer(8) });

global.fetch = async (url, opt = {}) => {
  const method = opt.method || 'GET';
  const body = opt.body && typeof opt.body === 'string' ? JSON.parse(opt.body) : opt.body;
  calls.push(`${method} ${url.replace(/https:\/\/[^/]+/, '')}`);
  const u = new URL(url);
  if (u.pathname === '/auth/v1/user') {
    return opt.headers.Authorization === 'Bearer good' ? json({ id: USER, email: 'a@b.ci' }) : json({}, 401);
  }
  if (u.pathname.startsWith('/rest/v1/rpc/')) {
    const fn = u.pathname.split('/').pop(); const p = db.profiles[0];
    if (fn === 'consume_credit') { if (p.credits >= 1) { p.credits--; return json(p.credits); } return json(null); }
    if (fn === 'refund_credit') { p.credits++; return json(p.credits); }
    if (fn === 'credit_payment') {
      const pay = db.payments.find(x => x.id === body.p_payment_id && x.status === 'pending');
      if (!pay) return json(null); pay.status = 'success'; p.credits += pay.credits; return json(p.credits);
    }
  }
  if (u.pathname.startsWith('/rest/v1/')) {
    const table = u.pathname.split('/').pop(); const match = parseFilters(u.search);
    if (method === 'GET') {
      let rows = db[table].filter(match); const ordre = u.searchParams.get('order');
      if (ordre) { const [c, d] = ordre.split('.'); rows = [...rows].sort((a, b) => (String(a[c]) < String(b[c]) ? -1 : 1) * (d === 'desc' ? -1 : 1)); }
      const lim = Number(u.searchParams.get('limit')); if (lim) rows = rows.slice(0, lim);
      return json(rows);
    }
    if (method === 'POST') { const row = { id: uuid(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body }; db[table].push(row); return json([row], 201); }
    if (method === 'PATCH') { const rows = db[table].filter(match); rows.forEach(r => Object.assign(r, body)); return json(rows); }
  }
  if (u.pathname.startsWith('/storage/v1/object/')) return json({ Key: 'ok' });
  if (u.hostname === 'geniuspay.ci') {
    if (method === 'POST') { const ref = 'MTX-' + (++idn); gp[ref] = { status: 'pending', amount: body.amount }; return json({ success: true, data: { reference: ref, checkout_url: 'https://pay/' + ref } }); }
    const ref = decodeURIComponent(u.pathname.split('/').pop()); return gp[ref] ? json({ success: true, data: { reference: ref, ...gp[ref] } }) : json({ success: false }, 404);
  }
  if (u.hostname === 'api.telegram.org') { telegram.push(String(body.text)); return json({ ok: true }); }
  if (u.hostname === 'api.sunoapi.org') {
    if (u.pathname.endsWith('/generate/credit')) return suno.creditsKo ? json({ code: 500, msg: 'erreur' }, 500) : json({ code: 200, msg: 'success', data: suno.credits });
    if (u.pathname.endsWith('/generate') && suno.limiteRestantes > 0) { suno.limiteRestantes--; return json({ code: 430, msg: 'call frequency too high' }); }
    if (u.pathname.endsWith('/generate/record-info')) { suno.lectures++; if (suno.recordLimite) return json({ code: 430, msg: 'call frequency too high' }); }
    if (u.pathname.endsWith('/generate')) { if (suno.generateFails) return json({ code: 429, msg: 'busy' }); suno.generations = (suno.generations || 0) + 1; return json({ code: 200, data: { taskId: 'task-1' } }); }
    return json({ code: 200, data: { status: suno.status, response: { sunoData: [{ audioUrl: suno.audioUrl || '' }] } } });
  }
  if (u.hostname === 'cdn.suno') return json({});
  throw new Error('fetch inattendu ' + url);
};

const handler = p => require(`${ROOT}/api/${p}`);
const securite = require(`${ROOT}/api/_lib/securite`);
const tracksLib = require(`${ROOT}/api/_lib/tracks`);
// Hors scénarios dédiés : pas d'attente ni de limite de lecture (les tests enchaînent les appels)
tracksLib.delais.avant = 0; tracksLib.delais.intervalle = 0; tracksLib.delais.reessai = [10, 10];
tracksLib.delais.priseEnCharge = 0; tracksLib.delais.reprise = 0; // dans les tests, une chanson en file est « prenable » dès l'appel suivant
async function call(p, { method = 'POST', body = {}, query = {}, token = 'good', garder = false } = {}) {
  if (!garder) { securite.reinitialiser(); tracksLib.reinitialiserLimites(); }
  await new Promise(r => setTimeout(r, 3)); // l'heure avance d'au moins 3 ms entre deux appels (horodatages de la file)
  const res = { code: 0, body: null, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } };
  await handler(p)({ method, body, query, headers: { host: 'novatempo.vercel.app', authorization: token ? `Bearer ${token}` : undefined } }, res);
  return res;
}
const credits = () => db.profiles[0].credits;
let ok = 0, ko = 0;
const check = (label, cond) => { cond ? ok++ : ko++; console.log(`${cond ? 'OK ' : 'ÉCHEC'}  ${label}`); };

(async () => {
  // --- Paiement
  check('webhook forgé (référence inconnue) ne crédite rien', (await call('webhook/geniuspay', { body: { status: 'SUCCESS', metadata: { user_id: USER, credits: 9999 } } })).code === 200 && credits() === 0);
  check('achat sans connexion refusé', (await call('pay/create-payment', { body: { pack: 'pack3' }, token: null })).code === 401);
  check('pack inventé refusé', (await call('pay/create-payment', { body: { pack: 'pack999' } })).code === 400);
  const cp = await call('pay/create-payment', { body: { pack: 'pack3' } });
  const pay = db.payments[0];
  check('achat pack3 : lien de paiement + paiement en attente 2500 F / 3 crédits', cp.code === 200 && cp.body.checkout_url && pay.status === 'pending' && pay.amount === 2500 && pay.credits === 3 && pay.provider_reference);
  check('webhook "succès" alors que GeniusPay dit "pending" : rien', (await call('webhook/geniuspay', { body: { event: 'payment.success', data: { reference: pay.provider_reference, status: 'completed' } } })) && credits() === 0);
  gp[pay.provider_reference].status = 'completed';
  await call('webhook/geniuspay', { body: { data: { reference: pay.provider_reference } } });
  check('webhook après paiement confirmé : +3 crédits', credits() === 3);
  await call('webhook/geniuspay', { body: { data: { reference: pay.provider_reference } } });
  const v = await call('pay/verify-payment', { method: 'GET', query: { pid: pay.id } });
  check('webhook rejoué + vérification au retour : toujours 3 (pas de double crédit)', credits() === 3 && v.body.status === 'success');
  const cp2 = await call('pay/create-payment', { body: { pack: 'pack1' } });
  const pay2 = db.payments[1]; gp[pay2.provider_reference] = { status: 'completed', amount: 500 };
  await call('pay/verify-payment', { method: 'GET', query: { pid: pay2.id } });
  check('montant payé inférieur au prix : pas de crédit', credits() === 3);

  // --- Génération
  const lyrics = '[Couplet 1]\nUne chanson pour Awa\n[Refrain]\nTralala';
  check('génération sans connexion refusée', (await call('songs/generate-audio', { body: { lyrics }, token: null })).code === 401);
  suno.generateFails = true;
  const g1 = await call('songs/generate-audio', { body: { lyrics, genre: 'Zouk', voice: 'female', occasion: 'amour' } });
  check('Suno refuse : erreur 502 et crédit rendu (3)', g1.code === 502 && credits() === 3 && db.tracks[0].statut === 'failed');
  suno.generateFails = false;
  const g2 = await call('songs/generate-audio', { body: { lyrics, genre: 'Zouk', voice: 'female', occasion: 'amour', titre: 'Pour Awa' } });
  const t = db.tracks[1];
  check('génération OK : 1 crédit retiré (2), chanson en base "processing"', g2.code === 200 && credits() === 2 && t.statut === 'processing' && t.suno_task_id === 'task-1' && g2.body.job_id === t.id);
  check('statut demandé par un autre compte refusé', (await call('songs/check-status', { method: 'GET', query: { id: t.id }, token: 'bad' })).code === 401);
  check('statut en cours', (await call('songs/check-status', { method: 'GET', query: { id: t.id } })).body.status === 'processing');
  suno.status = 'SUCCESS'; suno.audioUrl = 'https://cdn.suno/x.mp3';
  await call('songs/suno-callback', { body: { data: { task_id: 'task-1', callbackType: 'complete' } } });
  check('callback Suno : chanson sauvegardée dans le Storage', t.statut === 'completed' && t.url_audio.includes('/storage/v1/object/public/tracks/'));
  const s = await call('songs/check-status', { method: 'GET', query: { id: t.id } });
  check('statut "completed" renvoyé au Studio avec l’URL', s.body.status === 'completed' && s.body.outputs[0].audio_url === t.url_audio);

  suno.status = 'PENDING'; suno.audioUrl = null;
  db.profiles[0].credits = 1;
  await Promise.all([call('songs/generate-audio', { body: { lyrics } }), call('songs/generate-audio', { body: { lyrics } })]);
  check('double-clic avec 1 crédit : une seule génération acceptée', credits() === 0 && db.tracks.filter(x => x.statut === 'processing').length === 1);
  check('0 crédit : génération refusée (402)', (await call('songs/generate-audio', { body: { lyrics } })).code === 402);

  const t3 = db.tracks.find(x => x.statut === 'processing');
  suno.status = 'GENERATE_AUDIO_FAILED'; suno.audioUrl = null;
  await call('songs/check-status', { method: 'GET', query: { id: t3.id } });
  await call('songs/suno-callback', { body: { data: { task_id: t3.suno_task_id } } });
  check('échec Suno après lancement : crédit rendu une seule fois', credits() === 1 && t3.statut === 'failed');

  // --- Solde Suno : alerte Telegram et suspension préventive (le client n'est jamais débité pour rien)
  const solde = require(`${ROOT}/api/_lib/suno-solde`);
  const generer = () => call('songs/generate-audio', { body: { lyrics } });
  db.profiles[0].credits = 3; suno.generateFails = false; suno.status = 'PENDING'; suno.audioUrl = null;
  solde.reinitialiser(); telegram.length = 0; suno.credits = 5;
  const bloque = await generer();
  check('solde Suno épuisé : création suspendue (503) et client NON débité', bloque.code === 503 && /pas été débité/.test(bloque.body.error) && credits() === 3);
  check('solde Suno épuisé : alerte Telegram envoyée', telegram.some(t => /épuisé/.test(t) && /SUSPENDUES/.test(t)));
  await generer();
  check('alerte « épuisé » non répétée à chaque tentative', telegram.filter(t => /épuisé/.test(t)).length === 1);
  solde.reinitialiser(); telegram.length = 0; suno.credits = 150;
  const bas = await generer();
  check('solde bas : création autorisée + alerte « bientôt vide »', bas.code === 200 && credits() === 2 && telegram.some(t => /bientôt vide/.test(t) && t.includes('150')));
  solde.reinitialiser(); telegram.length = 0; suno.credits = 5000;
  const normal = await generer();
  check('solde normal : création autorisée, aucune alerte', normal.code === 200 && credits() === 1 && !telegram.some(t => /solde Suno/.test(t)));
  solde.reinitialiser(); suno.creditsKo = true;
  const panneSolde = await generer();
  check('lecture du solde en panne : les clients ne sont pas bloqués', panneSolde.code === 200 && credits() === 0);
  suno.creditsKo = false; solde.reinitialiser();

  // --- Limite de SunoAPI (20 requêtes / 10 s) : le client ne doit jamais en pâtir
  db.tracks.forEach(x => { x.statut = 'completed'; });
  db.profiles[0].credits = 3; solde.reinitialiser(); suno.credits = 5000;
  suno.limiteRestantes = 2;
  const reessai = await generer();
  check('Suno répond « trop d\'appels » 2 fois : relancé automatiquement, le client voit une chanson créée (1 crédit)', reessai.code === 200 && suno.limiteRestantes === 0 && credits() === 2);
  // Suno toujours saturé après les relances : la chanson entre en FILE D'ATTENTE (client non refusé, crédit gardé)
  suno.limiteRestantes = 5;
  const sature = await generer();
  const enFile = db.tracks.find(x => x.id === (sature.body && sature.body.job_id));
  check('limite de débit persistante : file d\'attente (202), crédit gardé, chanson « en attente »', sature.code === 202 && sature.body.queued === true && credits() === 1 && enFile.statut === 'pending' && !enFile.suno_task_id);
  suno.limiteRestantes = 5;
  const attente = await call('songs/check-status', { method: 'GET', query: { id: enFile.id } });
  check('en attente : le client voit son rang, ni échec ni remboursement', attente.body.status === 'processing' && attente.body.queued === true && attente.body.position === 1 && credits() === 1 && enFile.statut === 'pending');
  suno.limiteRestantes = 0;
  const repart = await call('songs/check-status', { method: 'GET', query: { id: enFile.id } });
  check('Suno a de la place : la chanson en file démarre toute seule', enFile.statut === 'processing' && !!enFile.suno_task_id && repart.body.status === 'processing' && !repart.body.queued);
  const enCours = db.tracks.find(x => x.statut === 'processing');
  const creditsAvant = credits();
  suno.recordLimite = true;
  const lectureLimitee = await call('songs/check-status', { method: 'GET', query: { id: enCours.id } });
  check('lecture du statut refusée par la limite : la chanson reste « en cours », ni échec ni remboursement', lectureLimitee.body.status === 'processing' && enCours.statut === 'processing' && credits() === creditsAvant);
  suno.recordLimite = false;
  tracksLib.delais.intervalle = 60000; tracksLib.reinitialiserLimites(); suno.lectures = 0;
  for (let i = 0; i < 6; i++) await call('songs/check-status', { method: 'GET', query: { id: enCours.id }, garder: true });
  check('le navigateur interroge toutes les 5 s : une seule lecture chez Suno (au lieu de 6)', suno.lectures === 1);
  db.tracks.forEach(x => { if (x !== enCours) x.suno_task_id = `ancienne-${x.id}`; }); // la simulation réutilise le même identifiant Suno
  await call('songs/suno-callback', { body: { data: { task_id: enCours.suno_task_id } }, garder: true });
  check('le rappel (callback) de Suno passe toujours, même pendant l\'attente', suno.lectures === 2);
  tracksLib.delais.avant = 20000; tracksLib.reinitialiserLimites(); suno.lectures = 0;
  enCours.created_at = new Date().toISOString();
  await call('songs/check-status', { method: 'GET', query: { id: enCours.id }, garder: true });
  check('chanson lancée il y a moins de 20 s : aucune lecture inutile chez Suno', suno.lectures === 0);
  tracksLib.delais.avant = 0; tracksLib.delais.intervalle = 0; tracksLib.reinitialiserLimites();

  // --- File d'attente : équité (premier arrivé, premier servi) et pas de double lancement
  db.tracks.forEach(x => { x.statut = 'completed'; });
  const iso = decalageMs => new Date(Date.now() + decalageMs).toISOString();
  const nouvelle = (id, age) => { const t = { id, user_id: USER, titre: 'T', paroles: '[Refrain]\nAwa', style_musical: 'Zouk', voix: 'male', statut: 'pending', suno_task_id: null, created_at: iso(-age), updated_at: iso(-60000) }; db.tracks.push(t); return t; };
  const ancienne = nouvelle('00000000-0000-0000-0002-000000000001', 4000), recente = nouvelle('00000000-0000-0000-0002-000000000002', 1000);
  tracksLib.delais.lot = 1; suno.limiteRestantes = 0; suno.generations = 0;
  const rRecente = await call('songs/check-status', { method: 'GET', query: { id: recente.id } });
  check('file d\'attente : la plus récente attend son tour (rang 2), la plus ancienne passe d\'abord', rRecente.body.queued === true && rRecente.body.position === 2 && recente.statut === 'pending' && suno.generations === 0);
  await call('songs/check-status', { method: 'GET', query: { id: ancienne.id } });
  check('file d\'attente : la plus ancienne démarre (1 seul lancement chez Suno)', ancienne.statut === 'processing' && suno.generations === 1);
  const rRecente2 = await call('songs/check-status', { method: 'GET', query: { id: recente.id } });
  check('file d\'attente : une fois la première partie, la suivante démarre à son tour', recente.statut === 'processing' && suno.generations === 2 && rRecente2.body.status === 'processing');
  // Deux navigateurs demandent la même chanson en file au même instant : un seul lancement (prise en charge atomique)
  const jumelle = nouvelle('00000000-0000-0000-0002-000000000004', 500); tracksLib.delais.priseEnCharge = 5000; suno.generations = 0;
  await Promise.all([call('songs/check-status', { method: 'GET', query: { id: jumelle.id }, garder: true }), call('songs/check-status', { method: 'GET', query: { id: jumelle.id }, garder: true })]);
  check('aucun double lancement même avec des demandes simultanées', suno.generations === 1 && jumelle.statut === 'processing');
  tracksLib.delais.priseEnCharge = 0;
  const vieille = nouvelle('00000000-0000-0000-0002-000000000003', 20 * 60 * 1000); credits0 = credits();
  const rVieille = await call('songs/check-status', { method: 'GET', query: { id: vieille.id } });
  check('chanson trop longtemps en attente (> 15 min) : échec propre et crédit rendu', rVieille.body.status === 'failed' && vieille.statut === 'failed' && credits() === credits0 + 1);
  tracksLib.delais.lot = 5; db.tracks.forEach(x => { x.statut = 'completed'; });

  securite.reinitialiser();
  let dernier; for (let i = 0; i < 9; i++) dernier = await call('songs/generate-audio', { body: { lyrics }, garder: true });
  check('limite : la 9e demande de chanson en 10 min est refusée (429)', dernier.code === 429);
  securite.reinitialiser();
  let dl; for (let i = 0; i < 41; i++) dl = await call('songs/generate-lyrics', { body: { occasion: 'amour' }, garder: true });
  check('limite : la 41e demande de paroles en 1 min est refusée (429)', dl.code === 429);

  check('erreur Suno enregistrée dans le journal, sans clé ni e-mail', db.error_logs.length > 0 && db.error_logs.every(l => l.niveau && !/Bearer|a@b\.ci/.test(JSON.stringify(l))));
  const nav = await call('erreurs', { body: { message: 'x is not defined', page: '/studio.html' } });
  check('erreur du navigateur reçue et journalisée', nav.code === 200 && db.error_logs.some(l => l.source === 'navigateur'));

  const logsAvant = db.error_logs.length;
  const reqCasse = { method: 'POST', query: {}, headers: {} }; Object.defineProperty(reqCasse, 'body', { get() { throw new Error('Invalid JSON'); } });
  const resCasse = { code: 0, body: null, status(c) { this.code = c; return this; }, json(o) { this.body = o; return this; } };
  await handler('webhook/geniuspay')(reqCasse, resCasse);
  check('webhook avec un corps illisible : refus 400 simple, sans fausse alerte critique', resCasse.code === 400 && db.error_logs.length === logsAvant);

  console.log(`\n${ok} réussis, ${ko} échoués`);
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

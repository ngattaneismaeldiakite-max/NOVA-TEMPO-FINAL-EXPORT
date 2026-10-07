// Simulation hors-ligne des fonctions /api avec une fausse base et de fausses API externes.
process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
process.env.GENIUSPAY_PUBLIC_KEY = 'pk';
process.env.GENIUSPAY_SECRET_KEY = 'sk';
process.env.SUNO_API_KEY = 'suno';
const ROOT = process.argv[2] || require('path').resolve(__dirname, '..');

const USER = '11111111-1111-1111-1111-111111111111';
const db = { profiles: [{ id: USER, credits: 0 }], payments: [], tracks: [], error_logs: [] };
const gp = {}; // reference -> {status, amount}
let suno = { generateFails: false, status: 'PENDING', audioUrl: null };
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
    if (method === 'GET') return json(db[table].filter(match));
    if (method === 'POST') { const row = { id: uuid(), created_at: new Date().toISOString(), ...body }; db[table].push(row); return json([row], 201); }
    if (method === 'PATCH') { const rows = db[table].filter(match); rows.forEach(r => Object.assign(r, body)); return json(rows); }
  }
  if (u.pathname.startsWith('/storage/v1/object/')) return json({ Key: 'ok' });
  if (u.hostname === 'geniuspay.ci') {
    if (method === 'POST') { const ref = 'MTX-' + (++idn); gp[ref] = { status: 'pending', amount: body.amount }; return json({ success: true, data: { reference: ref, checkout_url: 'https://pay/' + ref } }); }
    const ref = decodeURIComponent(u.pathname.split('/').pop()); return gp[ref] ? json({ success: true, data: { reference: ref, ...gp[ref] } }) : json({ success: false }, 404);
  }
  if (u.hostname === 'api.sunoapi.org') {
    if (u.pathname.endsWith('/generate')) return suno.generateFails ? json({ code: 429, msg: 'busy' }) : json({ code: 200, data: { taskId: 'task-1' } });
    return json({ code: 200, data: { status: suno.status, response: { sunoData: [{ audioUrl: suno.audioUrl || '' }] } } });
  }
  if (u.hostname === 'cdn.suno') return json({});
  throw new Error('fetch inattendu ' + url);
};

const handler = p => require(`${ROOT}/api/${p}`);
const securite = require(`${ROOT}/api/_lib/securite`);
async function call(p, { method = 'POST', body = {}, query = {}, token = 'good', garder = false } = {}) {
  if (!garder) securite.reinitialiser();
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

  securite.reinitialiser();
  let dernier; for (let i = 0; i < 9; i++) dernier = await call('songs/generate-audio', { body: { lyrics }, garder: true });
  check('limite : la 9e demande de chanson en 10 min est refusée (429)', dernier.code === 429);
  securite.reinitialiser();
  let dl; for (let i = 0; i < 41; i++) dl = await call('songs/generate-lyrics', { body: { occasion: 'amour' }, garder: true });
  check('limite : la 41e demande de paroles en 1 min est refusée (429)', dl.code === 429);

  check('erreur Suno enregistrée dans le journal, sans clé ni e-mail', db.error_logs.length > 0 && db.error_logs.every(l => l.niveau && !/Bearer|a@b\.ci/.test(JSON.stringify(l))));
  const nav = await call('erreurs', { body: { message: 'x is not defined', page: '/studio.html' } });
  check('erreur du navigateur reçue et journalisée', nav.code === 200 && db.error_logs.some(l => l.source === 'navigateur'));

  console.log(`\n${ok} réussis, ${ko} échoués`);
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

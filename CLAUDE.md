# Nova Tempo

SaaS de chansons personnalisées (paroles + voix générées), marché Afrique de l'Ouest francophone.
Production : https://novatempo.vercel.app — dépôt GitHub `ngattaneismaeldiakite-max/NOVA-TEMPO-FINAL-EXPORT`, branche `main` déployée automatiquement par Vercel.

## Architecture

- **Pages** : HTML statiques à la racine (les adresses du site en dépendent), sans framework ni build. Fichiers statiques rangés dans `assets/` : `images/`, `audio/`, `css/`, `js/`. `manifest.json` et `sw.js` restent à la racine (portée du service worker).
  - `index.html` accueil (démos, occasions, tarifs, FAQ, pied de page)
  - `login.html`, `signup.html`, `reset-password.html` authentification
  - `studio.html` création d'une chanson : **parcours guidé en étapes** (une question par écran, choix rapides, aperçu gratuit des paroles avec « Une autre version » avant de dépenser un crédit) + fenêtre d'achat de crédits intégrée
  - `assets/js/studio-parcours.js` **description des étapes de chaque occasion** (questions, options accordées h/f, clé envoyée au serveur, style conseillé). Pour changer une question, modifier ce fichier ; chaque `cle` doit correspondre à une balise utilisée dans les textes.
  - `profil.html` solde, achat de packs, chansons ; `creations.html` paroles
  - `cgu.html`, `privacy.html`
- **Logo** : uniquement via `assets/css/logo.css` + `assets/images/logo-nova-tempo.png` (texte détouré) et 4 barres `.eq-bar` animées. Même balisage sur toutes les pages ; ne pas créer d'autre version.
- **API** : fonctions Vercel dans `api/` (CommonJS, sans dépendance npm, `fetch` natif).
  - Code partagé dans `api/_lib/` (le préfixe `_` empêche Vercel d'en faire des fonctions).
  - **Limite plan Hobby : 12 fonctions max** (8 aujourd'hui). Tout fichier `.js` hors `_lib` compte.
- **Supabase** (projet `wxkeuyyppzuqplnutwzk`) : auth (e-mail + Google) et base. Migrations dans `supabase/migrations/` (à exécuter à la main dans le SQL Editor).
- **GeniusPay** : paiement Mobile Money (Wave, Orange, MTN, Moov).
- **SunoAPI** : génération audio (fichiers conservés 14 jours chez Suno → copiés dans le bucket Storage `tracks`).

## Visuel, médias et responsive

- `assets/css/legal.css` : style commun de cgu.html et privacy.html (design sombre, texte juridique inchangé).
- `vercel.json` : cache navigateur 1 jour sur `/assets/*` (images/audio allégés).
- Démos `assets/audio/demo1-3.mp3` en 128 kbps (originaux dans l'historique git) ; images optimisées (cartes 880 px, pochettes 640 px, hero 1200 px). Garder ces tailles pour tout nouvel ajout.
- `assets/js/partage-audio.js` : téléchargement et partage du vrai MP3 (Web Share API).
- Chaque page se termine par un bloc CSS « Finitions responsive » : zones tactiles ≥ 44 px, aucun débordement de 320 à 1600 px. À re-vérifier après toute modification de mise en page.
- Accueil : les 3 disques sont sur une seule ligne (tailles en clamp) et tiennent dans le premier écran d'un portable.
- Les chansons générées ne sont pas recompressées (impossible côté Vercel) : surveiller le stockage Supabase (plan gratuit 1 Go) et prévoir rétention, plan Pro ou Cloudflare R2.
- **CGU et confidentialité réécrites le 17/10/2026** pour décrire ce que fait vraiment le service : vendeur « Nova Tempo, Ismael Diakite, Abidjan », contact WhatsApp +225 07 77 42 04 15 et e-mail novatempo2@gmail.com (Gmail dédié du site, aussi expéditeur des e-mails Supabase via mot de passe d'application ; à remplacer par une adresse sur le futur nom de domaine), 1 crédit = 1 chanson (packs 1 000 / 2 500 / 4 000 F, crédits sans expiration, non remboursables en argent sauf double paiement), paroles gratuites illimitées avant de valider, crédit rendu automatiquement en cas d'échec, usage personnel + partage libre (usage commercial seulement pour l'occasion « Promotion »), âge 18 ans (16 avec accord parent), droit ivoirien / tribunaux d'Abidjan, suppression de compte sous 30 jours, compte inactif 12 mois. **Si un prix, un délai ou une règle change, mettre à jour `cgu.html` ET `privacy.html`.** À faire relire par un juriste (clause de rétractation) ; la déclaration du traitement de données auprès de l'ARTCI est à vérifier par le propriétaire.
- Guide d'exploitation du propriétaire (alertes, recharge Suno, litiges de paiement, retour en arrière, avant-lancement) : **fichier privé hors du dépôt** `..\Guide-exploitation-PRIVE.md` (dossier « SaaS NOVA TEMPO » du Bureau). Ne pas le remettre dans le dépôt public.
- **`.vercelignore`** : exclut du site public la documentation, les tests, `supabase/`, `CLAUDE.md`, `README.md`, `promo/source` et les guides vidéo. Tout nouveau fichier interne (non destiné aux clients) doit y être ajouté, car Vercel sert tout le reste tel quel.

## Règles métier (ne pas casser)

- 1 crédit = 1 chanson. Prix uniquement dans `api/_lib/pricing.js` : pack1 1 000 F / pack3 2 500 F / pack5 4 000 F. Nouvel inscrit : 0 crédit.
- **Les crédits ne sont modifiés que par le serveur**, via les fonctions SQL `credit_payment`, `consume_credit`, `refund_credit` (réservées à `service_role`). Jamais d'UPDATE de `profiles.credits` depuis le navigateur.
- Webhook GeniusPay : ne jamais croire le contenu reçu ; `api/_lib/payments.js` redemande le statut à GeniusPay et vérifie le montant.
- Chansons : table unique `tracks` (`statut` pending/processing/completed/failed). Les tables `songs`, `creations`, `user_credits`, `song_jobs` sont historiques et inutilisées.
- Échec de génération → crédit rendu une seule fois (`markFailed` dans `api/_lib/tracks.js`).
- Textes de chansons : `api/_lib/templates/<occasion>.js`, balises `{NOM}`, `{RELATION}`, `{ANECDOTE}`, `{DUREE_RELATION}`… ; à enregistrer dans `TEMPLATES` de `api/songs/generate-lyrics.js`.
- **Accord masculin/féminin** : jamais de « ami(e) » dans les modèles. Écrire `{T:masc|fém}` pour la personne fêtée (question « Cette chanson est pour… » du Studio, sinon déduit du mot de relation) et `{J:masc|fém}` pour le chanteur (voix choisie). Couple/groupe ou duo : la forme est retirée comme un champ vide.
- **Lien avec la personne** (Anniversaire) : la question du Studio (`amour` / `parent` / `enfant` / `proche`) filtre les modèles via `LIENS` dans `generate-lyrics.js` (numéros des modèles, à tenir à jour si on en ajoute). Sans réponse : déduit du mot de relation, sinon modèles « general » (jamais de texte romantique).
- **Couplet sur mesure [Pont]** : construit dans `construirePont` (generate-lyrics.js) à partir de `qualites`, `voeux`, `lecons`, `promesses`, `message`, inséré avant l'[Outro]. Hommage `statut: 'vivant'` : les lignes de deuil sont retirées (`LIGNES_DE_DEUIL`).
- **Événement** : chaque type proposé dans le Studio tire ses textes via `TYPES_EVENEMENT` (numéros des modèles de evenement.js) ; type libre → fêtes génériques.
- Anti-doublon : le surnom choisi ne se répète pas dans une même ligne.
- **Questions du formulaire = usage dans les textes** : `{DUREE_RELATION}` s'emploie toujours en « ___ que je t'aime » (une durée), `{AGE}` pour l'âge fêté. Un nombre seul devient « N ans ».
- **Champ vide = jamais de valeur bidon** (« mon cher / ma chère », « un concept unique »…) : `generate-lyrics.js` retire l'interpellation, remplace « pour {NOM} » par « pour toi » ou retire la ligne, puis choisit le modèle qui reste le plus complet. Écrire les nouveaux modèles pour que les balises soient des morceaux entre virgules (« {NOM}, … ») autant que possible.
- Messages d'erreur d'auth en français via `assets/js/auth-messages.js`.
- Design : fond noir `#06060A`, vert néon `#D4FF00`, rose `#FF0066`, police Satoshi. Pas d'`alert()` : fenêtres et notifications intégrées.
- Pas de faux témoignages ni de faux avis sur le site.

## Variables Vercel

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GENIUSPAY_PUBLIC_KEY`, `GENIUSPAY_SECRET_KEY`, `SUNO_API_KEY` (Production ; Preview avec clés sandbox GeniusPay). Optionnels : `SITE_URL`, `GENIUSPAY_API_BASE`. Alertes téléphone (facultatif) : `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Solde Suno (facultatif, `api/_lib/suno-solde.js`) : `SUNO_SEUIL_ALERTE` (défaut 200 crédits → alerte Telegram), `SUNO_SEUIL_BLOCAGE` (défaut 20 → création suspendue sans débiter le client), `SUNO_CREDITS_PAR_CHANSON` (affiche « ≈ N chansons »). Une lecture impossible du solde ne bloque jamais les clients.
- **Limite SunoAPI : 20 requêtes / 10 s pour tout le site** (crédits : 1 000 pour 5 $, jamais périmés). Le Studio demande l'état toutes les 5 s : `refreshTrack` (api/_lib/tracks.js) ne lit donc Suno qu'une fois par 12 s et par chanson, jamais avant 20 s ; le callback Suno passe toujours (`forcer`). Les codes 405/430 (trop d'appels) → relance automatique au lancement (2 attentes : 1,2 s et 2,5 s) et « on réessaie » à la lecture, jamais d'échec ni de remboursement. Le code 429 = crédits insuffisants (pas de relance).
- **File d'attente des chansons** (`demarrerEnAttente`, `positionEnFile` dans api/_lib/tracks.js) : si Suno reste saturé après les relances, `generate-audio` répond **202 `{queued:true}`** : la chanson reste `pending` sans `suno_task_id`, le crédit reste réservé. Le Studio (check-status toutes les 5 s) relance les plus anciennes par lots de 5 (`delais.lot`), prise en charge atomique par `updated_at` (10 s) → jamais de double lancement ; `check-status` renvoie `{queued, position}`. Au-delà de 15 min d'attente : échec + crédit rendu. Styles/voix Suno : `api/_lib/styles.js`. Test de charge : `node tests/charge.js [dossier] [clients]` (variables `ARRIVEE_S`, `CLIENTS` ; temps accéléré ×10) — résultat : 100 clients simultanés → 100 chansons livrées (sans file : 17), 300 clients sur 1 min → 300 livrées, médiane 6,6 min.
- **GeniusPay** (docs : geniuspay.ci/docs/api) : clés `pk_sandbox_`/`sk_sandbox_` = test, `pk_live_`/`sk_live_` = vrai argent (« Activez le mode live dans vos paramètres »). Frais : 1 % + 100 F + frais opérateur (Wave 1,5 %, autres 3,5 à 5 %), retraits gratuits. Nos appels (`X-API-Key`, `X-API-Secret`, `/api/v1/merchant/payments`) sont conformes à la doc.

## Façon de travailler

- Une branche par changement → Preview Vercel (protégée par l'authentification Vercel) → fusion dans `main` après validation.
- Node n'est pas installé : pour tester en local, `ELECTRON_RUN_AS_NODE=1` avec l'exécutable d'Antigravity IDE (`%LOCALAPPDATA%\Programs\Antigravity IDE\Antigravity IDE.exe`).
- Le propriétaire est francophone et non développeur : expliquer simplement, en français.

## Points ouverts (mis de côté à la demande du propriétaire)

- **Reprise e-mails (07/10/2026)** : choix = Gmail dédié (création du compte en cours, validation en deux étapes à faire ensuite), puis mot de passe d'application, puis SMTP dans Supabase (Authentication > SMTP) et modèles en français. Suivi des erreurs (Telegram) : terminé et testé.

- **E-mails (SMTP)** — reporté le 06/10/2026. Sans SMTP, l'e-mail « mot de passe oublié » n'arrive pas chez les clients (le SMTP par défaut de Supabase n'envoie qu'à l'équipe). Brevo : compte créé, plan gratuit, mais **vérification par SMS bloquée** (SMS non reçus sur numéro ivoirien) → réessayer / support Brevo. Alternative prête : SMTP Gmail dédié (`smtp.gmail.com:465` + mot de passe d'application). Ensuite : traduire en français le modèle « Reset Password » de Supabase.
- **Nom de domaine** — pas encore acheté. Prévu : `novatempo.ci` ou `.com` → Vercel + expéditeur e-mail fiable (Brevo).
- **E-mails transactionnels** (après SMTP) : reçu de paiement, « ta chanson est prête », relances / promotions (fête des mères, Saint-Valentin…).
- **Témoignages** : section à ajouter quand de vrais avis clients existeront (jamais de faux avis).
- Vérifier Supabase → URL Configuration : Site URL `https://novatempo.vercel.app`, Redirect URLs `https://novatempo.vercel.app/**` et `https://nova-tempo-final-export-*-isma20.vercel.app/**` (non confirmé par le propriétaire).

## Sécurité et suivi (07/10/2026)

- En-têtes HTTP (CSP, HSTS…) dans `vercel.json` : toute nouvelle source externe (script, police, API) doit y être autorisée, sinon elle est bloquée.
- `api/_lib/securite.js` : limites de débit ; `api/_lib/erreurs.js` : `signaler()` écrit dans la table `error_logs` (Supabase) et envoie une alerte Telegram pour le niveau `critique`. Les erreurs du navigateur arrivent par `api/erreurs.js` + `assets/js/suivi-erreurs.js`.
- Migrations à lancer à la main : `20261007_durcissement_base.sql`, `20261007_journal_erreurs.sql`.
- Tests : `node tests/simulation.js` (aussi lancés par GitHub Actions). Les relancer après toute modification de `api/`.

## Vidéos publicitaires (`promo/`)

- `promo/video.html` (généré, ne pas modifier à la main) = modèle `promo/source/video.tpl.html` + vrai CSS de `studio.html`, via `promo/source/build-video.js <racine> <modèle>`. Formats `?format=tiktok|reels|whatsapp|facebook-fil|facebook-carre|youtube`, `?version=longue` (70 s). Bouton « Enregistrer » : capture de l'onglet + téléchargement nommé par réseau.
- Musique : extraits de `demo3` (original, commit ee8bcf3 ; disque du milieu de l’accueil) coupés à 61,65 / 66,12 / 69,24 s dans `promo/musique/` + `enveloppes.js` (énergie 30 img/s et temps forts lus par l'animation). Outil de découpe dans le dossier temporaire de session (lamejs + mpg123-decoder) : à recréer si besoin.
- Guide utilisateur : `promo/SCRIPT.md` ; voix off ElevenLabs : `promo/VOIX-OFF.md` (les sous-titres des films = ce texte, à garder synchronisés).
- Fluidité : ne jamais animer une variable CSS héritée sur toute la scène (recalcul complet à chaque image) ; animer seulement transform/opacity d'éléments ciblés. Chaque écran du Studio doit tenir dans le téléphone (690 px), bouton « Suivant » visible. Contrôle : `&test&fige&t=…` (image arrêtée).

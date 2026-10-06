# Nova Tempo

SaaS de chansons personnalisées (paroles + voix générées), marché Afrique de l'Ouest francophone.
Production : https://novatempo.vercel.app — dépôt GitHub `ngattaneismaeldiakite-max/NOVA-TEMPO-FINAL-EXPORT`, branche `main` déployée automatiquement par Vercel.

## Architecture

- **Pages** : HTML/CSS/JS statiques à la racine, sans framework ni build.
  - `index.html` accueil (démos, occasions, tarifs, FAQ, pied de page)
  - `login.html`, `signup.html`, `reset-password.html` authentification
  - `studio.html` création d'une chanson (+ fenêtre d'achat de crédits intégrée)
  - `profil.html` solde, achat de packs, chansons ; `creations.html` paroles
  - `cgu.html`, `privacy.html`
- **Logo** : uniquement via `logo.css` + `logo-nova-tempo.png` (texte détouré) et 4 barres `.eq-bar` animées. Même balisage sur toutes les pages ; ne pas créer d'autre version.
- **API** : fonctions Vercel dans `api/` (CommonJS, sans dépendance npm, `fetch` natif).
  - Code partagé dans `api/_lib/` (le préfixe `_` empêche Vercel d'en faire des fonctions).
  - **Limite plan Hobby : 12 fonctions max** (7 aujourd'hui). Tout fichier `.js` hors `_lib` compte.
- **Supabase** (projet `wxkeuyyppzuqplnutwzk`) : auth (e-mail + Google) et base. Migrations dans `supabase/migrations/` (à exécuter à la main dans le SQL Editor).
- **GeniusPay** : paiement Mobile Money (Wave, Orange, MTN, Moov).
- **SunoAPI** : génération audio (fichiers conservés 14 jours chez Suno → copiés dans le bucket Storage `tracks`).

## Règles métier (ne pas casser)

- 1 crédit = 1 chanson. Prix uniquement dans `api/_lib/pricing.js` : pack1 1 000 F / pack3 2 500 F / pack5 4 000 F. Nouvel inscrit : 0 crédit.
- **Les crédits ne sont modifiés que par le serveur**, via les fonctions SQL `credit_payment`, `consume_credit`, `refund_credit` (réservées à `service_role`). Jamais d'UPDATE de `profiles.credits` depuis le navigateur.
- Webhook GeniusPay : ne jamais croire le contenu reçu ; `api/_lib/payments.js` redemande le statut à GeniusPay et vérifie le montant.
- Chansons : table unique `tracks` (`statut` pending/processing/completed/failed). Les tables `songs`, `creations`, `user_credits`, `song_jobs` sont historiques et inutilisées.
- Échec de génération → crédit rendu une seule fois (`markFailed` dans `api/_lib/tracks.js`).
- Textes de chansons : `api/_lib/templates/<occasion>.js`, balises `{NOM}`, `{RELATION}`, `{ANECDOTE}`, `{DUREE_RELATION}`… ; à enregistrer dans `TEMPLATES` de `api/songs/generate-lyrics.js`.
- **Accord masculin/féminin** : jamais de « ami(e) » dans les modèles. Écrire `{T:masc|fém}` pour la personne fêtée (question « Cette chanson est pour… » du Studio, sinon déduit du mot de relation) et `{J:masc|fém}` pour le chanteur (voix choisie). Couple/groupe ou duo : la forme est retirée comme un champ vide.
- **Lien avec la personne** (Anniversaire) : la question du Studio (`amour` / `parent` / `enfant` / `proche`) filtre les modèles via `LIENS` dans `generate-lyrics.js` (numéros des modèles, à tenir à jour si on en ajoute). Sans réponse : déduit du mot de relation, sinon modèles « general » (jamais de texte romantique).
- **Questions du formulaire = usage dans les textes** : `{DUREE_RELATION}` s'emploie toujours en « ___ que je t'aime » (une durée), `{AGE}` pour l'âge fêté. Un nombre seul devient « N ans ».
- **Champ vide = jamais de valeur bidon** (« mon cher / ma chère », « un concept unique »…) : `generate-lyrics.js` retire l'interpellation, remplace « pour {NOM} » par « pour toi » ou retire la ligne, puis choisit le modèle qui reste le plus complet. Écrire les nouveaux modèles pour que les balises soient des morceaux entre virgules (« {NOM}, … ») autant que possible.
- Messages d'erreur d'auth en français via `auth-messages.js`.
- Design : fond noir `#06060A`, vert néon `#D4FF00`, rose `#FF0066`, police Satoshi. Pas d'`alert()` : fenêtres et notifications intégrées.
- Pas de faux témoignages ni de faux avis sur le site.

## Variables Vercel

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GENIUSPAY_PUBLIC_KEY`, `GENIUSPAY_SECRET_KEY`, `SUNO_API_KEY` (Production ; Preview avec clés sandbox GeniusPay). Optionnels : `SITE_URL`, `GENIUSPAY_API_BASE`.

## Façon de travailler

- Une branche par changement → Preview Vercel (protégée par l'authentification Vercel) → fusion dans `main` après validation.
- Node n'est pas installé : pour tester en local, `ELECTRON_RUN_AS_NODE=1` avec l'exécutable d'Antigravity IDE (`%LOCALAPPDATA%\Programs\Antigravity IDE\Antigravity IDE.exe`).
- Le propriétaire est francophone et non développeur : expliquer simplement, en français.

## Points ouverts

- Brancher un SMTP (Brevo ou Resend) dans Supabase et traduire les e-mails d'auth en français.
- Vérifier Supabase → URL Configuration : Site URL `https://novatempo.vercel.app`, Redirect URLs `https://novatempo.vercel.app/**` et `https://nova-tempo-final-export-*-isma20.vercel.app/**`.
- Ajouter une section témoignages quand de vrais avis clients existeront.

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
  - **Limite plan Hobby : 12 fonctions max** (7 aujourd'hui). Tout fichier `.js` hors `_lib` compte.
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
- CGU : mentionne des offres « Mensuel/Annuel » qui n'existent pas — à trancher par le propriétaire.

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

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GENIUSPAY_PUBLIC_KEY`, `GENIUSPAY_SECRET_KEY`, `SUNO_API_KEY` (Production ; Preview avec clés sandbox GeniusPay). Optionnels : `SITE_URL`, `GENIUSPAY_API_BASE`.

## Façon de travailler

- Une branche par changement → Preview Vercel (protégée par l'authentification Vercel) → fusion dans `main` après validation.
- Node n'est pas installé : pour tester en local, `ELECTRON_RUN_AS_NODE=1` avec l'exécutable d'Antigravity IDE (`%LOCALAPPDATA%\Programs\Antigravity IDE\Antigravity IDE.exe`).
- Le propriétaire est francophone et non développeur : expliquer simplement, en français.

## Points ouverts (mis de côté à la demande du propriétaire)

- **E-mails (SMTP)** — reporté le 06/10/2026. Sans SMTP, l'e-mail « mot de passe oublié » n'arrive pas chez les clients (le SMTP par défaut de Supabase n'envoie qu'à l'équipe). Brevo : compte créé, plan gratuit, mais **vérification par SMS bloquée** (SMS non reçus sur numéro ivoirien) → réessayer / support Brevo. Alternative prête : SMTP Gmail dédié (`smtp.gmail.com:465` + mot de passe d'application). Ensuite : traduire en français le modèle « Reset Password » de Supabase.
- **Nom de domaine** — pas encore acheté. Prévu : `novatempo.ci` ou `.com` → Vercel + expéditeur e-mail fiable (Brevo).
- **E-mails transactionnels** (après SMTP) : reçu de paiement, « ta chanson est prête », relances / promotions (fête des mères, Saint-Valentin…).
- **Témoignages** : section à ajouter quand de vrais avis clients existeront (jamais de faux avis).
- Vérifier Supabase → URL Configuration : Site URL `https://novatempo.vercel.app`, Redirect URLs `https://novatempo.vercel.app/**` et `https://nova-tempo-final-export-*-isma20.vercel.app/**` (non confirmé par le propriétaire).

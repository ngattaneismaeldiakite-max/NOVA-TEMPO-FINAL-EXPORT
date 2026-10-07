# Vidéo Nova Tempo — script, scènes et guide d'enregistrement

Format **vertical 9:16 (1080×1920)** pour TikTok, Reels, statuts WhatsApp et publicités Facebook/Instagram.
Deux versions, dans le même fichier :

- **Courte, 30 secondes (par défaut)** : faite pour la publicité, centrée sur l'effet « wahou ».
- **Longue, 70 secondes** : explicative, pour une page d'accueil ou un tutoriel (`?version=longue`).

Les écrans sont ceux du **vrai Studio** (mêmes questions, options, boutons, prix). Les paroles sont **générées par ton vrai moteur** de textes, et la chanson est ta vraie démo (`demo1.mp3`).

Fichier à ouvrir : `promo/video.html` (double-clic, ou `…/promo/video.html` sur le site).

## Version courte (30 s) — l'idée

Le « wahou », c'est **le prénom qui apparaît dans les paroles**, puis **la chanson qui se joue**. Tout le reste sert à y arriver vite : on ne montre que 3 questions en entier, les autres défilent en accéléré, et le prix est dans l'écran final.

| Temps | Écran | Voix off |
|---|---|---|
| 0:00–0:03 | Disque « Pour toi » qui tourne · « Et si tu lui offrais une chanson avec son prénom ? » | « Et si tu lui offrais une chanson avec son prénom ? » |
| 0:03–0:12 | Le vrai Studio, en accéléré : occasion « Anniversaire », prénom « Awa », « une femme », « ma chérie », qualités « douce » et « forte », puis les autres questions défilent | « Avec Nova Tempo : tu choisis l'occasion, tu réponds à quelques questions simples… » |
| 0:12–0:17 | **Les paroles apparaissent ligne par ligne, avec le prénom en évidence** | « …et tu découvres tes paroles, gratuitement. Écrites rien que pour elle. » |
| 0:17–0:20 | « Créer ma chanson », 1 crédit, création en cours | « Un clic, et ta chanson est créée… » |
| 0:20–0:25 | **« Ta chanson est prête ! » : la chanson se joue**, boutons WhatsApp et MP3 | « …prête à envoyer sur WhatsApp. » |
| 0:25–0:30 | Logo · « Offre une chanson, pas un cadeau de plus. » · novatempo.vercel.app · « Dès 1 000 F · Wave, Orange, MTN, Moov » | « Dès mille francs. Nova Tempo : offre une chanson, pas un cadeau de plus. » |

Les **sous-titres** sont déjà dans la vidéo : elle marche aussi sans voix, ce qui compte pour les pubs vues sans le son.

Conseil pour la publicité : mets l'accroche écrite (« Et si tu lui offrais une chanson avec son prénom ? ») dans le texte de la publication, et propose une action claire (« Crée la tienne ») avec le lien du site.

## Enregistrer la vidéo (Windows)

1. Ouvre `promo/video.html` dans **Chrome ou Edge**, en **plein écran (F11)**. La scène 9:16 s'adapte à la hauteur de ton écran.
2. Ajoute `?propre` à la fin de l'adresse pour cacher la fine barre de progression.
3. Lance ton enregistreur d'écran :
   - **Windows + G** (Xbox Game Bar), puis « Capturer » ; ou
   - **CapCut → Enregistrement d'écran** (il peut capturer le son du système : la démo sera alors dans la vidéo) ; ou OBS.
4. Clique sur **« Lancer la vidéo »**. Elle se joue seule et reste sur la dernière image.
5. Arrête l'enregistrement. **Espace** relance la vidéo, **Échap** l'arrête.

Options dans l'adresse (combinables, par exemple `video.html?propre&t=12`) :
`?version=longue` (70 s) · `?muet` (ne joue pas la démo) · `?propre` (sans barre de progression) · `?t=12` (démarre à la seconde 12, pour refaire une seule partie).

## Monter dans CapCut

1. Importe l'enregistrement et **recadre en 9:16** si ton écran est large.
2. **Voix off** : enregistre-la dans CapCut (« Voix off ») en lisant la colonne de droite, ou utilise « Texte en voix ».
3. **Musique** : une piste rythmée, à **15–20 % de volume** pendant la voix.
4. Exporte en **1080×1920, 30 images/s** (720×1280 suffit pour WhatsApp et pèse moins lourd).

## Qualité de l'image

L'enregistrement a la résolution de **ton écran** : sur un écran 1366×768, la vidéo sera plus floue qu'en Full HD. Les textes sont très gros exprès pour rester lisibles.

## Pour modifier la vidéo

- Les textes, les temps et les scènes se règlent dans `promo/source/video.tpl.html` (fonctions `filmCourt` et section « Le film »).
- La page `promo/video.html` est fabriquée à partir de ce modèle et du **vrai CSS du Studio** (`studio.html`) avec `promo/source/build-video.js` (demande-moi de la régénérer si le Studio change d'apparence).
- Option `?test` : affiche l'état final des animations (sert à vérifier la mise en page d'une scène à l'arrêt).

---

## Version longue (70 s, explicative) — script complet

| Temps | Écran | Voix off (à lire posément, ton chaleureux) |
|---|---|---|
| 0:00–0:04 | Disque « Pour toi » qui tourne, barres vertes animées, texte « Imagine une chanson écrite rien que pour elle. » | « Imagine… une chanson, écrite rien que pour elle. » |
| 0:04–0:11 | « Un message de plus ? » (barré) · « Un cadeau oublié ? » (barré) · **Une vraie chanson.** · Son prénom / Votre histoire / Une vraie voix · logo | « Pas un message de plus : une vraie chanson, avec son prénom et votre histoire. Voici comment ça marche avec Nova Tempo. » |
| 0:11–0:16 | **Étape 1** — le Studio, choix de l'occasion (Amour, Anniversaire, Mariage, Hommage…), le doigt choisit « Anniversaire » | « Étape un : tu choisis l'occasion. Amour, anniversaire, mariage, hommage… » |
| 0:16–0:33 | **Étape 2** — une question par écran : prénom « Awa », « une femme », « mon amour » ; petit nom « ma chérie » ; qualités « douce » et « forte » ; vœux ; souvenir « notre voyage à Assinie » ; petit mot | « Étape deux : quelques questions simples, une par écran. Son prénom, le petit nom que tu lui donnes, ce que tu aimes chez elle, un souvenir à vous deux. Tu peux passer ce que tu veux garder secret. » |
| 0:33–0:37 | **Étape 3** — le style (Coupé Décalé « conseillé », Afrobeat, Zouk, Amapiano, Gospel…) et la voix (homme, femme, duo) | « Étape trois : le style — Coupé Décalé, Amapiano, Afrobeat, Zouk, Gospel… et la voix : homme, femme ou duo. » |
| 0:37–0:45 | **Étape 4** — les paroles apparaissent ligne par ligne ; boutons « Modifier le texte » et « Une autre version » avec l'étiquette GRATUIT | « Étape quatre : tu découvres tes paroles, gratuitement. Tu les modifies si tu veux, ou tu demandes une autre version, sans rien payer. » |
| 0:45–0:52 | **Étape 5** — « Créer ma chanson » (1 crédit), le solde passe à 0, écran « Création en cours » avec les vraies phrases (« Les musiciens accordent leurs guitares… ») | « Étape cinq : tu valides. Un crédit, une chanson. Notre studio compose et enregistre ta chanson en quelques minutes. » |
| 0:52–0:59 | « Ta chanson est prête ! », lecteur audio (la vraie démo se joue), boutons WhatsApp et Télécharger le MP3 | « Ta chanson est prête. Tu l'écoutes, tu la télécharges, et tu l'envoies sur WhatsApp, en un clic. » |
| 0:59–1:05 | Les 3 packs (1 000 F · 2 500 F · 4 000 F), logos Wave, Orange, MTN, Moov | « À partir de mille francs, avec Wave, Orange, MTN ou Moov Money. » |
| 1:05–1:10 | Logo, **« Offre une chanson, pas un cadeau de plus. »**, bouton novatempo.vercel.app | « Nova Tempo. Offre une chanson, pas un cadeau de plus. » |

Les **sous-titres** (bande en bas) sont déjà dans la vidéo : elle fonctionne aussi sans voix, notamment pour les statuts regardés sans le son.

Pour la lancer : `promo/video.html?version=longue`. Mêmes consignes d'enregistrement et de montage que ci-dessus.

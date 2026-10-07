# Vidéo Nova Tempo — script, scènes et guide d'enregistrement

Format **vertical 9:16 (1080×1920)**, **70 secondes**, pour TikTok, Reels, statuts WhatsApp, Facebook.
Les écrans sont ceux du **vrai Studio** (mêmes questions, mêmes options, mêmes boutons, mêmes prix) ; les paroles montrées sont **générées par ton vrai moteur** de textes ; la chanson de la scène 8 est ta vraie démo (`demo1.mp3`).

Fichier à ouvrir : `promo/video.html` (double-clic, ou sur le site `…/promo/video.html`).

## Script complet (voix off)

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

## Enregistrer la vidéo (Windows)

1. Ouvre `promo/video.html` dans **Chrome ou Edge**. Mets la fenêtre en **plein écran (F11)** : la scène 9:16 s'adapte à la hauteur de ton écran.
2. Ajoute `?propre` à la fin de l'adresse pour cacher la fine barre de progression.
3. Lance ton enregistreur d'écran (au choix) :
   - **Windows + G** (Xbox Game Bar) → « Capturer » → enregistrer ; ou
   - **CapCut → Enregistrement d'écran** (le son du système peut être capturé : la démo audio de la scène 8 sera alors dans la vidéo) ; ou OBS.
4. Clique sur **« Lancer la vidéo »**. Elle se joue seule pendant 70 secondes et reste sur la dernière image.
5. Arrête l'enregistrement. **Espace** relance la vidéo, **Échap** l'arrête.

Options dans l'adresse : `?muet` (ne joue pas la démo), `?propre`, `?t=33` (démarre à la seconde 33 : pratique pour refaire une seule scène). On peut les combiner : `video.html?propre&t=45`.

## Monter dans CapCut

1. Importe l'enregistrement, **recadre en 9:16** si ton écran est large (zoom pour remplir ; les bandes noires latérales disparaissent).
2. **Voix off** : enregistre-la dans CapCut (« Voix off ») en lisant la colonne de droite, ou utilise « Texte en voix » de CapCut. Les repères de temps ci-dessus sont ceux de l'image.
3. **Musique** : une piste douce et rythmée, **volume bas** pendant la voix (environ 15 à 20 %).
4. Exporte en **1080×1920, 30 images/s**. Pour WhatsApp, 720×1280 suffit et pèse moins lourd.

## Qualité de l'image : à savoir

L'enregistrement a la résolution de **ton écran** : sur un écran 1366×768 la vidéo sera plus floue qu'en 1920×1080. Les textes sont très gros exprès pour rester lisibles. Pour le meilleur résultat, enregistre sur un écran Full HD en plein écran.

## Variante courte (30 s) possible

Pour un format publicitaire de 30 secondes : garder 0:00–0:04 (accroche), 0:11–0:16 (occasion), un extrait de l'étape 2, 0:37–0:45 (paroles), 0:52–0:59 (résultat) et 1:05–1:10 (appel à l'action). Dis-le-moi si tu veux que je prépare cette version.

## Pour modifier la vidéo

- Les textes, les temps et les scènes se règlent dans `promo/source/video.tpl.html` (section « Le film »).
- La page `promo/video.html` est fabriquée à partir de ce modèle et du **vrai CSS du Studio** (`studio.html`). Si le Studio change d'apparence, on la régénère avec `promo/source/build-video.js` (demande-moi de le faire, c'est une commande à lancer avec Antigravity).
- Option `?test` : affiche l'état final des animations (sert à vérifier la mise en page d'une scène à l'arrêt).

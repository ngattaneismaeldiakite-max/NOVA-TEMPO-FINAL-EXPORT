# Vidéos Nova Tempo — formats, musique et guide

Une seule page, `promo/video.html`, fabrique **toutes les vidéos publicitaires**, chacune adaptée à son réseau, avec **ta musique (`demo3`, le disque du milieu de l’accueil)** et des animations qui battent à son rythme.

## Les fichiers produits

| Réseau | Format | Durée | Nom du fichier téléchargé |
|---|---|---|---|
| TikTok | vertical 9:16 | 30 s | `NovaTempo_TikTok_9x16_30s.mp4` |
| Reels et stories Instagram/Facebook | vertical 9:16 | 30 s | `NovaTempo_Instagram-Reels_9x16_30s.mp4` |
| Statut WhatsApp | vertical 9:16 | 30 s | `NovaTempo_WhatsApp-Statut_9x16_30s.mp4` |
| Fil d'actualité Facebook/Instagram | 4:5 | 20 s | `NovaTempo_Facebook-Fil_4x5_20s.mp4` |
| Publicité carrée | 1:1 | 15 s | `NovaTempo_Facebook-Carre_1x1_15s.mp4` |
| YouTube, Facebook horizontal | 16:9 | 30 s | `NovaTempo_YouTube_16x9_30s.mp4` |
| Vidéo explicative (site, tutoriel) | 9:16 | 70 s | `NovaTempo_Explicative_9x16_70s.mp4` |

Chaque format a sa propre mise en page (le téléphone, le titre et les sous-titres sont replacés), pas un simple recadrage. Les durées de 20 et 15 s racontent la même histoire en plus serré.

## La musique

- Source : `demo3` (ta chanson à la pochette Nova Tempo, disque du milieu de l’accueil), version originale de qualité.
- Extraits coupés automatiquement (30 s à partir de 61,6 s, 20 s à partir de 66,1 s, 15 s à partir de 69,2 s), calés sur le tempo (115 BPM) : la musique fait une petite pause puis **explose au moment où les paroles apparaissent**, et son passage le plus fort accompagne « Ta chanson est prête ! ».
- Fichiers : `promo/musique/NovaTempo_musique_30s.mp3`, `_20s.mp3`, `_15s.mp3` (192 kbit/s, fondu de sortie, volume réglé sans saturation). Tu peux aussi les utiliser seuls dans CapCut.
- Dans la vidéo, la chanson passe dans le **lecteur de l'écran « Ta chanson est prête ! »** sans coupure : c'est elle qu'on « entend » sortir du Studio.

## Les animations

- Le disque, les barres vertes, le halo autour du téléphone et les lumières **suivent l'énergie de la musique** ; des flashs et des particules (notes ♪) tombent sur les **temps forts**.
- **Caméra 3D** : le téléphone pivote légèrement, puis zoome sur les paroles au moment clé.
- Les écrans restent ceux du **vrai Studio** ; les paroles viennent de ton vrai moteur, avec le prénom en évidence.

## Fabriquer une vidéo (sans Game Bar ni renommage)

1. Double-clique sur `promo/video.html` (Chrome ou Edge). Mets la fenêtre en **plein écran (F11)**.
2. Choisis le réseau dans la liste en haut (TikTok, WhatsApp, Facebook…).
3. Clique sur **« ⏺ Enregistrer et télécharger »**.
4. Dans la fenêtre du navigateur : choisis **« Cet onglet »**, active **« Partager aussi l'audio de l'onglet »**, puis **« Partager »**.
5. Ne touche plus à rien : la vidéo se joue avec la musique, puis **le fichier se télécharge tout seul avec le bon nom** (dossier Téléchargements).
6. Recommence pour chaque réseau.

« ▶ Aperçu » joue la vidéo sans l'enregistrer. **Espace** relance, **Échap** arrête.

Si le navigateur ne peut produire que du WebM (ancienne version), ouvre le fichier dans CapCut et exporte-le en MP4.

**Qualité** : le fichier a la résolution de ton écran (plus net sur un écran Full HD en plein écran).

### Options dans l'adresse
`?format=tiktok` (ou `reels`, `whatsapp`, `facebook-fil`, `facebook-carre`, `youtube`) · `&muet` (sans musique, pour mettre ta propre voix et musique au montage) · `&propre` (sans barre de progression) · `&t=12` (démarre à la seconde 12) · `?version=longue` (70 s).

## Voix off (facultatif)

Les sous-titres sont dans l'image, la vidéo fonctionne sans voix. Pour ajouter ta voix dans CapCut, lis le texte des sous-titres ; garde la musique autour de 20 % pendant que tu parles.

| Version 30 s | Voix off |
|---|---|
| 0–3 s | « Et si tu lui offrais une chanson avec son prénom ? » |
| 3–12 s | « Avec Nova Tempo : tu choisis l'occasion, tu réponds à quelques questions simples… » |
| 12–17 s | « …et tu découvres tes paroles, gratuitement. Écrites rien que pour elle. » |
| 17–25 s | « Un clic, et ta chanson est créée… prête à envoyer sur WhatsApp. » |
| 25–30 s | « Dès mille francs. Nova Tempo : offre une chanson, pas un cadeau de plus. » |

## Pour modifier

- Textes, temps, scènes : `promo/source/video.tpl.html` (fonctions `film30`, `film20`, `film15`, `film70`).
- Mise en page de chaque format : même fichier, section CSS « Formats ».
- Changer de musique : la recouper avec l'outil de découpe (demande-moi), qui produit les MP3 et `musique/enveloppes.js` (le rythme lu par l'animation).
- La page est fabriquée à partir du modèle et du **vrai CSS du Studio** par `promo/source/build-video.js` (demande-moi de la régénérer si le Studio change).
- `&test` : affiche l'état final des animations, image figée (vérification de mise en page).

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

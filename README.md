# SaaS NOVA TEMPO

Chansons personnalisées en quelques minutes : le client répond à quelques questions, lit ses paroles, puis reçoit sa chanson chantée (Afrobeat, Coupé Décalé, Zouk, Gospel…).

🌐 **Site en ligne** : https://novatempo.vercel.app

## Organisation du projet

```
├── index.html            Accueil : démos, occasions, tarifs, FAQ
├── studio.html           Le Studio : parcours guidé pour créer une chanson
├── profil.html           Mon espace : solde, achat de crédits, mes chansons
├── creations.html        Mes créations : paroles des chansons
├── login.html            Connexion (e-mail ou Google) + mot de passe oublié
├── signup.html           Inscription
├── reset-password.html   Choix d'un nouveau mot de passe
├── cgu.html, privacy.html  Pages légales
├── manifest.json, sw.js  Application installable et notifications
│
├── assets/
│   ├── images/           Logos, pochettes, photos des occasions
│   ├── audio/            Démos de l'accueil
│   ├── css/logo.css      Logo animé (le même sur toutes les pages)
│   └── js/               Parcours du Studio, messages d'erreur, connexion Supabase
│
├── api/                  Serveur (fonctions Vercel)
│   ├── pay/              Création et vérification des paiements GeniusPay
│   ├── webhook/          Confirmation des paiements par GeniusPay
│   ├── songs/            Paroles, lancement Suno, suivi des chansons
│   └── _lib/             Code partagé + textes des chansons par occasion
│
└── supabase/migrations/  Scripts SQL de la base de données
```

## Services utilisés

| Service | Rôle |
|---|---|
| **Vercel** | Hébergement du site et du serveur (déploiement automatique depuis la branche `main`) |
| **Supabase** | Comptes clients, base de données, stockage des fichiers audio |
| **GeniusPay** | Paiement Mobile Money (Wave, Orange Money, MTN MoMo, Moov Money) |
| **SunoAPI** | Création de la musique chantée |

## Tarifs

1 crédit = 1 chanson · 1 000 F (1 chanson) · 2 500 F (3 chansons) · 4 000 F (5 chansons)

## Pour les développeurs

Les règles du projet (crédits, paiements, textes, design) sont décrites dans [`CLAUDE.md`](CLAUDE.md).

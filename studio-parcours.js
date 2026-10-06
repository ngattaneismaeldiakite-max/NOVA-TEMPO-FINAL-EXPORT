// studio-parcours.js
// Description du parcours guidé du Studio, occasion par occasion.
// Chaque réponse est envoyée à /api/songs/generate-lyrics sous la clé indiquée (`cle`),
// qui correspond aux balises des modèles de chansons :
//   nom -> {NOM}, relation -> {RELATION}, anecdote -> {ANECDOTE}, duree -> {DUREE_RELATION},
//   age -> {AGE}, moment_difficile -> {MOMENT_DIFFICILE}, benediction -> {BENEDICTION},
//   produit -> {PRODUIT}, argument -> {ARGUMENT}, cta -> {CTA}
// et pour le couplet sur mesure [Pont] : qualites, voeux, lecons, promesses, message, statut.
// Une option peut être un texte, ou { h, f } (masculin / féminin selon "Cette chanson est pour…").
(function () {
    const QUALITES = [
        { h: 'généreux', f: 'généreuse' }, { h: 'courageux', f: 'courageuse' }, 'drôle',
        { h: 'doux', f: 'douce' }, { h: 'fort', f: 'forte' }, { h: 'battant', f: 'battante' },
        { h: 'attentionné', f: 'attentionnée' }, 'sage', { h: 'joyeux', f: 'joyeuse' }, 'fidèle',
        { h: 'travailleur', f: 'travailleuse' }, { h: 'patient', f: 'patiente' }, { h: 'gentil', f: 'gentille' },
        { h: 'rayonnant', f: 'rayonnante' }, { h: 'protecteur', f: 'protectrice' }, 'unique'
    ];

    const SURNOMS_AMOUR = ['mon cœur', 'mon bébé', 'mon amour',
        { h: 'mon roi', f: 'ma reine' }, { h: 'mon chéri', f: 'ma chérie' }, { h: 'mon homme', f: 'ma princesse' }];

    const SURNOMS_PAR_LIEN = {
        amour: SURNOMS_AMOUR,
        parent: [{ h: 'papa', f: 'maman' }, { h: 'papi', f: 'mamie' }, { h: 'tonton', f: 'tata' }, { h: 'mon père', f: 'ma mère' }],
        enfant: [{ h: 'mon fils', f: 'ma fille' }, 'mon bébé', { h: 'mon grand', f: 'ma princesse' }],
        proche: [{ h: 'mon frère', f: 'ma sœur' }, { h: 'mon ami', f: 'mon amie' }, { h: 'mon pote', f: 'ma copine' },
            { h: 'mon cousin', f: 'ma cousine' }, { h: 'mon collègue', f: 'ma collègue' }]
    };

    // Étapes communes
    const MUSIQUE = { type: 'musique' };
    const APERCU = { type: 'apercu' };
    const MESSAGE = {
        type: 'textes', titre: 'Un petit mot rien que pour {lui}',
        sousTitre: 'Une phrase que tu veux lui dire : elle sera chantée telle quelle.',
        champs: [{ cle: 'message', label: 'Ton message', exemple: 'Ex : merci d\'avoir toujours cru en moi', max: 110 }]
    };
    const QUALITES_ETAPE = {
        type: 'choix', cle: 'qualites', multiple: 2, titre: 'Ce que tu aimes chez {lui}',
        sousTitre: 'Choisis jusqu\'à 2 qualités.', options: QUALITES
    };

    const OCCASIONS = {
        amour: {
            label: 'Amour', emoji: '❤️', style: 'Zouk', accroche: 'Déclare ta flamme',
            etapes: [
                { type: 'personne', nom: { label: 'Comment s\'appelle la personne que tu aimes ?', exemple: 'Ex : Awa, Koffi' }, sexe: true },
                { type: 'choix', cle: 'relation', titre: 'Comment l\'appelles-tu ?', sousTitre: 'Le petit nom qui sera chanté.', options: SURNOMS_AMOUR, autre: 'Un autre petit nom…' },
                QUALITES_ETAPE,
                { type: 'textes', titre: 'Votre histoire', sousTitre: 'Facultatif, mais c\'est ce qui rend la chanson unique.', champs: [
                    { cle: 'duree', label: 'Depuis combien de temps êtes-vous ensemble ?', exemple: 'Ex : 3 ans', max: 25 },
                    { cle: 'anecdote', label: 'Un souvenir à vous deux', exemple: 'Ex : notre voyage à Assinie', max: 80 }
                ] },
                { ...MESSAGE, titre: 'Ce que tu n\'as jamais osé lui dire', champs: [{ cle: 'message', label: 'Ton message', exemple: 'Ex : tu es la plus belle chose qui me soit arrivée', max: 110 }] },
                MUSIQUE, APERCU
            ]
        },
        anniversaire: {
            label: 'Anniversaire', emoji: '🎂', style: 'Coupé Décalé', accroche: 'Fête son grand jour',
            etapes: [
                { type: 'personne', nom: { label: 'Qui fête son anniversaire ?', exemple: 'Ex : Awa, Papa Koffi' }, sexe: true, lien: true },
                { type: 'choix', cle: 'relation', titre: 'Comment l\'appelles-tu ?', sousTitre: 'Le petit nom qui sera chanté.', options: etat => SURNOMS_PAR_LIEN[etat.reponses.lien] || SURNOMS_PAR_LIEN.proche, autre: 'Un autre petit nom…' },
                { ...QUALITES_ETAPE, titre: 'Ce qui {le} rend unique' },
                { type: 'choix', cle: 'voeux', multiple: 2, titre: 'Ton vœu pour sa nouvelle année', sousTitre: 'Choisis jusqu\'à 2 vœux.', options: ['la santé', 'la réussite', 'l\'amour', 'la paix', 'beaucoup de joie', 'une longue vie', 'plein de bénédictions'] },
                { type: 'textes', titre: 'Les détails', sousTitre: 'Facultatif.', champs: [
                    { cle: 'age', label: 'Quel âge fête-t-on ?', exemple: 'Ex : 30', max: 15 },
                    { cle: 'anecdote', label: 'Un souvenir ensemble', exemple: 'Ex : nos fous rires d\'enfance', max: 80 },
                    { cle: 'duree', label: 'Depuis combien de temps vous vous connaissez ?', exemple: 'Ex : 10 ans', max: 25, si: etat => etat.reponses.lien === 'amour' || etat.reponses.lien === 'proche' }
                ] },
                MESSAGE, MUSIQUE, APERCU
            ]
        },
        mariage: {
            label: 'Mariage', emoji: '💍', style: 'Zouk', accroche: 'Célèbre votre union',
            etapes: [
                { type: 'personne', nom: { label: 'Prénom de ton/ta partenaire', exemple: 'Ex : Awa, Koffi' }, sexe: true },
                { type: 'choix', cle: 'relation', titre: 'Comment l\'appelles-tu ?', sousTitre: 'Le petit nom qui sera chanté.', options: [{ h: 'mon mari', f: 'ma femme' }, { h: 'mon époux', f: 'mon épouse' }, { h: 'mon roi', f: 'ma reine' }, 'mon amour', 'mon cœur'], autre: 'Un autre petit nom…' },
                QUALITES_ETAPE,
                { type: 'choix', cle: 'promesses', multiple: 2, titre: 'Ta promesse pour la vie', sousTitre: 'Choisis jusqu\'à 2 promesses : « Je te promets… »', options: ['de t\'aimer chaque jour', 'de te protéger', 'de rester à tes côtés', 'de te faire sourire', 'de construire notre famille', 'd\'être fidèle'] },
                { type: 'textes', titre: 'Votre histoire', sousTitre: 'Facultatif.', champs: [
                    { cle: 'duree', label: 'Depuis combien de temps êtes-vous ensemble ?', exemple: 'Ex : 5 ans', max: 25 },
                    { cle: 'anecdote', label: 'Votre rencontre ou un souvenir', exemple: 'Ex : notre rencontre à la fac', max: 80 }
                ] },
                MESSAGE, MUSIQUE, APERCU
            ]
        },
        hommage: {
            label: 'Hommage', emoji: '🕊️', style: 'Gospel', accroche: 'Honore une personne chère',
            etapes: [
                { type: 'personne', nom: { label: 'À qui rends-tu hommage ?', exemple: 'Ex : Papa Koffi, Grand-mère Aya' }, sexe: true, statut: true },
                { type: 'choix', cle: 'relation', titre: 'Qui est-{il} pour toi ?', sousTitre: 'Ce lien sera chanté.', options: [{ h: 'papa', f: 'maman' }, { h: 'grand-père', f: 'grand-mère' }, { h: 'mon frère', f: 'ma sœur' }, { h: 'mon oncle', f: 'ma tante' }, { h: 'mon ami', f: 'mon amie' }, { h: 'mon mentor', f: 'ma mentore' }], autre: 'Un autre lien…' },
                { type: 'choix', cle: 'lecons', multiple: 2, titre: 'Ce qu\'{il} t\'a appris', sousTitre: 'Choisis jusqu\'à 2 leçons : « Tu m\'as appris… »', options: ['le courage', 'la foi', 'le travail', 'le partage', 'le respect', 'la patience', 'à ne jamais abandonner', 'à aimer sans compter'] },
                { ...QUALITES_ETAPE, titre: 'Les qualités qu\'on retient de {lui}' },
                { type: 'textes', titre: 'Tes souvenirs', sousTitre: 'Facultatif.', champs: [
                    { cle: 'anecdote', label: 'Un souvenir précieux', exemple: 'Ex : ses repas du dimanche', max: 80 },
                    { cle: 'duree', label: 'Depuis combien de temps nous a-t-{il} quittés ?', exemple: 'Ex : 2 ans', max: 25, si: etat => etat.reponses.statut === 'disparu' }
                ] },
                { ...MESSAGE, titre: 'Ton message pour {lui}', champs: [{ cle: 'message', label: 'Ton message', exemple: 'Ex : merci pour tout ce que tu m\'as donné', max: 110 }] },
                MUSIQUE, APERCU
            ]
        },
        adoration: {
            label: 'Adoration', emoji: '🙌', style: 'Gospel', accroche: 'Loue et rends grâce',
            etapes: [
                { type: 'choix', cle: 'nom', titre: 'Comment appelles-tu Dieu ?', sousTitre: 'Ce nom sera chanté.', requis: true, options: ['Seigneur', 'Jésus', 'mon Dieu', 'Papa Dieu', 'l\'Éternel', 'Saint-Esprit'], autre: 'Un autre nom…' },
                { type: 'choix', cle: 'moment_difficile', titre: 'L\'épreuve qu\'il t\'a fait traverser', sousTitre: 'Facultatif.', options: ['la maladie', 'le chômage', 'le deuil', 'la solitude', 'les dettes', 'la tempête'], autre: 'Une autre épreuve…' },
                { type: 'choix', cle: 'benediction', titre: 'La grâce que tu as reçue', sousTitre: 'Facultatif.', options: ['la guérison', 'la paix', 'un travail', 'une famille', 'la délivrance', 'la victoire'], autre: 'Une autre grâce…' },
                { type: 'textes', titre: 'Ton témoignage', sousTitre: 'Facultatif.', champs: [
                    { cle: 'anecdote', label: 'En quelques mots', exemple: 'Ex : quand tu m\'as relevé en 2020', max: 80 }
                ] },
                MUSIQUE, APERCU
            ]
        },
        promotion: {
            label: 'Promotion', emoji: '🚀', style: 'Afrobeat', accroche: 'Fais connaître ton offre',
            etapes: [
                { type: 'textes', titre: 'Ce que tu veux faire connaître', champs: [
                    { cle: 'produit', label: 'Nom du produit, du service ou de la boutique', exemple: 'Ex : Kôrô Jus, le salon Belle Allure', max: 50, requis: true },
                    { cle: 'argument', label: 'Son gros point fort', exemple: 'Ex : 100 % naturel, livré en 1 heure', max: 60 }
                ] },
                { type: 'choix', cle: 'nom', titre: 'À qui parle la chanson ?', sousTitre: 'Facultatif.', options: ['chers clients', 'la famille', 'les amis', 'tout le monde'], autre: 'Un autre public…' },
                { type: 'choix', cle: 'cta', titre: 'Ce que les gens doivent faire', sousTitre: 'L\'appel à l\'action chanté dans le refrain.', options: ['appelle-nous vite', 'passe nous voir', 'commande sur WhatsApp', 'réserve ta place', 'profite de l\'offre'], autre: 'Autre (ex : appelle le 07 00 00 00 00)…' },
                { type: 'textes', titre: 'Une accroche', sousTitre: 'Facultatif.', champs: [
                    { cle: 'anecdote', label: 'Un argument en plus', exemple: 'Ex : déjà 5 000 clients satisfaits', max: 80 }
                ] },
                MUSIQUE, APERCU
            ]
        },
        evenement: {
            label: 'Événement', emoji: '🎉', style: 'Coupé Décalé', accroche: 'Mets l\'ambiance',
            etapes: [
                { type: 'choix', cle: 'anecdote', titre: 'Quel est l\'événement ?', requis: true, options: ['la grande soirée', 'le lancement', 'la fête de fin d\'année', 'le baptême', 'la remise des diplômes', 'le gala', 'le concert'], autre: 'Un autre événement…' },
                { type: 'textes', titre: 'Les détails', sousTitre: 'Facultatif.', champs: [
                    { cle: 'nom', label: 'Qui est à l\'honneur ?', exemple: 'Ex : Awa, l\'équipe Nova', max: 40 },
                    { cle: 'duree', label: 'Quand ? Quelle ambiance ?', exemple: 'Ex : ce samedi soir', max: 30 }
                ] },
                { type: 'choix', cle: 'relation', titre: 'À qui s\'adresse la chanson ?', sousTitre: 'Facultatif.', options: ['les invités', 'l\'équipe', 'la famille', 'les amis', 'tout le monde'], autre: 'Un autre public…' },
                MUSIQUE, APERCU
            ]
        }
    };

    const STYLES = [
        { v: 'Afrobeat', e: '🌍' }, { v: 'Coupé Décalé', e: '🕺' }, { v: 'Zouk', e: '💃' }, { v: 'Amapiano', e: '🔥' },
        { v: 'Ndombolo', e: '🎸' }, { v: 'Gospel', e: '🙏' }, { v: 'Rap Français', e: '🎤' }
    ];

    window.NOVA_PARCOURS = { OCCASIONS, STYLES };
})();

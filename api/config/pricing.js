// api/config/pricing.js
// Fichier centralisé pour la configuration des offres.
// Ce fichier est la source unique de vérité pour les prix et les crédits.

module.exports = {
    OFFERS: {
        "essai": {
            id: "essai",
            name: "Essai",
            songs: 1,
            credits: 50, 
            price_fcfa: 1500,
            subtitle: "Idéal pour tester le concept",
            isPopular: false
        },
        "duo": {
            id: "duo",
            name: "Duo",
            songs: 2,
            credits: 100,
            price_fcfa: 2700,
            subtitle: "Le plus choisi 🔥 — économise 300 FCFA",
            isPopular: true
        },
        "collection": {
            id: "collection",
            name: "Collection",
            songs: 5,
            credits: 250,
            price_fcfa: 6000,
            subtitle: "Mariages, agences, gros événements — économise 1 500 FCFA",
            isPopular: false
        }
    }
};

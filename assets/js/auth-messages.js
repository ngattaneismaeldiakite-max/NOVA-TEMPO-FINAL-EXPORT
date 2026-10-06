// auth-messages.js
// Traduit les erreurs de Supabase Auth en messages clairs, en français.
(function () {
    const PAR_CODE = {
        invalid_credentials: "E-mail ou mot de passe incorrect.",
        user_already_exists: "Un compte existe déjà avec cet e-mail.",
        email_exists: "Un compte existe déjà avec cet e-mail.",
        weak_password: "Mot de passe trop faible : utilise au moins 8 caractères avec des lettres et des chiffres.",
        same_password: "Le nouveau mot de passe doit être différent de l'ancien.",
        email_address_invalid: "Cette adresse e-mail n'est pas valide.",
        validation_failed: "Vérifie l'adresse e-mail et le mot de passe saisis.",
        over_email_send_rate_limit: "Trop d'e-mails envoyés. Réessaie dans quelques minutes.",
        over_request_rate_limit: "Trop de tentatives. Patiente une minute avant de réessayer.",
        email_not_confirmed: "Ton adresse e-mail n'est pas encore confirmée. Vérifie ta boîte de réception.",
        user_not_found: "Aucun compte n'existe avec cet e-mail.",
        session_not_found: "Ta session a expiré. Recommence la procédure.",
        otp_expired: "Ce lien a expiré ou a déjà été utilisé. Demande un nouveau lien.",
        user_banned: "Ce compte est suspendu. Contacte-nous sur WhatsApp."
    };

    const PAR_TEXTE = [
        [/invalid login credentials/i, PAR_CODE.invalid_credentials],
        [/already (been )?registered|already exists/i, PAR_CODE.user_already_exists],
        [/at least \d+ characters|password should/i, "Le mot de passe doit contenir au moins 8 caractères."],
        [/different from the old/i, PAR_CODE.same_password],
        [/invalid format|unable to validate email/i, PAR_CODE.email_address_invalid],
        [/rate limit|too many/i, PAR_CODE.over_request_rate_limit],
        [/for security purposes.*after (\d+) seconds/i, "Pour ta sécurité, patiente quelques secondes avant de réessayer."],
        [/email not confirmed/i, PAR_CODE.email_not_confirmed],
        [/expired|invalid.*(token|link)/i, PAR_CODE.otp_expired],
        [/failed to fetch|network|load failed/i, "Connexion impossible. Vérifie ta connexion internet et réessaie."]
    ];

    window.novaAuthMessage = function (erreur) {
        if (!erreur) return "Une erreur est survenue. Réessaie.";
        if (erreur.code && PAR_CODE[erreur.code]) return PAR_CODE[erreur.code];
        const texte = String(erreur.message || erreur);
        for (const [motif, message] of PAR_TEXTE) {
            if (motif.test(texte)) return message;
        }
        return "Une erreur est survenue. Réessaie dans un instant.";
    };

    window.novaAuthCode = function (erreur) {
        if (!erreur) return null;
        if (erreur.code) return erreur.code;
        const texte = String(erreur.message || '');
        if (/invalid login credentials/i.test(texte)) return 'invalid_credentials';
        if (/already (been )?registered|already exists/i.test(texte)) return 'user_already_exists';
        return null;
    };
})();

// Envoie au serveur les erreurs JavaScript rencontrées par les clients (sans aucune donnée personnelle).
(function () {
    var envoyees = 0;
    function envoyer(message, ligne) {
        if (envoyees >= 3 || !message) return; // 3 erreurs maximum par page
        envoyees++;
        try {
            fetch('/api/erreurs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: String(message).slice(0, 300), page: location.pathname, ligne: ligne || null }),
                keepalive: true
            }).catch(function () {});
        } catch (e) {}
    }
    window.addEventListener('error', function (e) {
        if (e.target && e.target !== window) return; // images ou scripts introuvables : ignorés
        envoyer(e.message, e.lineno);
    });
    window.addEventListener('unhandledrejection', function (e) {
        envoyer('Promesse rejetée : ' + ((e.reason && e.reason.message) || e.reason));
    });
})();

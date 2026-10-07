// assets/js/partage-audio.js
// Télécharger le fichier MP3 lui-même, ou le partager (WhatsApp…) via le menu de partage du téléphone.
(function () {
    // "Pour Marie-Paule" -> "Pour Marie-Paule - Nova Tempo.mp3"
    function nomFichier(titre) {
        const propre = String(titre || 'Ma chanson').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 60);
        return `${propre || 'Ma chanson'} - Nova Tempo.mp3`;
    }

    async function recupererFichier(url, titre) {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Fichier indisponible');
        const blob = await res.blob();
        return new File([blob], nomFichier(titre), { type: 'audio/mpeg' });
    }

    function etat(bouton, texte) {
        if (!bouton) return;
        if (!bouton.dataset.texte) bouton.dataset.texte = bouton.innerHTML;
        bouton.innerHTML = texte || bouton.dataset.texte;
        bouton.style.pointerEvents = texte ? 'none' : '';
        bouton.style.opacity = texte ? '0.7' : '';
    }

    // Enregistre le MP3 sur l'appareil, avec un vrai nom de fichier
    async function telechargerAudio(url, titre, bouton) {
        etat(bouton, '<i class="fas fa-spinner fa-spin"></i> Préparation…');
        try {
            const fichier = await recupererFichier(url, titre);
            const lien = document.createElement('a');
            lien.href = URL.createObjectURL(fichier);
            lien.download = fichier.name;
            document.body.appendChild(lien);
            lien.click();
            setTimeout(() => { URL.revokeObjectURL(lien.href); lien.remove(); }, 4000);
        } catch (e) {
            // Dernier recours : ouvrir le fichier (appui long > Télécharger sur mobile)
            window.open(url, '_blank', 'noopener');
        } finally {
            etat(bouton);
        }
    }

    // Partage le fichier audio lui-même (WhatsApp, Messages…) ; sinon le télécharge
    async function partagerAudio(url, titre, bouton) {
        etat(bouton, '<i class="fas fa-spinner fa-spin"></i> Préparation…');
        try {
            const fichier = await recupererFichier(url, titre);
            if (navigator.canShare && navigator.canShare({ files: [fichier] })) {
                await navigator.share({
                    files: [fichier],
                    title: titre || 'Ma chanson Nova Tempo',
                    text: '🎵 Une chanson rien que pour toi, créée sur Nova Tempo'
                });
                return;
            }
            // Ordinateur ou navigateur sans partage de fichiers : on télécharge, puis on ouvre WhatsApp
            etat(bouton);
            await telechargerAudio(url, titre);
            if (typeof window.novaInfo === 'function') {
                window.novaInfo("Le fichier est téléchargé : joins-le dans WhatsApp avec le trombone 📎");
            }
        } catch (e) {
            if (e && e.name === 'AbortError') return; // partage annulé par l'utilisateur
            window.open(url, '_blank', 'noopener');
        } finally {
            etat(bouton);
        }
    }

    window.NovaAudio = { telechargerAudio, partagerAudio, nomFichier };
})();

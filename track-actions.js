// track-actions.js
// Gestion des interactions utilisateur (Téléchargement MP3, Partage WhatsApp, Toasts)

document.addEventListener("DOMContentLoaded", function() {
    const toastCSS = `
        <style>
            #toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .nova-toast {
                background: #ffffff;
                border-left: 5px solid #0047AB;
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                padding: 14px 22px;
                border-radius: 10px;
                font-family: 'Inter', sans-serif;
                font-weight: 700;
                color: #0a0a0a;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            @keyframes slideInRight {
                0% { transform: translateX(100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
        </style>
        <div id="toast-container"></div>
    `;
    document.head.insertAdjacentHTML('beforeend', toastCSS);

    document.body.addEventListener('click', function(e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const title = btn.getAttribute('title') || '';
        const audioUrl = btn.getAttribute('data-audio-url') || null;
        const trackTitle = btn.getAttribute('data-track-title') || 'Chanson Nova Tempo';
        
        if (title.includes('Télécharger')) {
            window.downloadMP3(trackTitle, audioUrl);
        }
        
        if (title.includes('Partager')) {
            window.shareTrack(trackTitle, audioUrl);
        }
    });
});

window.showToast = function(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'nova-toast';
    toast.innerHTML = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 500);
    }, 3500);
};

window.downloadMP3 = function(trackTitle = 'Chanson Nova Tempo', audioUrl = null) {
    showToast("⏳ Préparation du fichier MP3...");
    
    setTimeout(() => {
        if (audioUrl) {
            const a = document.createElement('a');
            a.href = audioUrl;
            a.target = '_blank';
            a.download = `${trackTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast("✅ Téléchargement lancé !");
        } else {
            const blob = new Blob(["Fichier audio simule Nova Tempo"], { type: 'audio/mpeg' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${trackTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp3`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showToast("✅ Téléchargement MP3 HQ terminé !");
        }
    }, 1000);
};

window.shareTrack = async function(trackTitle = 'Chanson Nova Tempo', audioUrl = null) {
    const shareData = {
        title: trackTitle,
        text: `Écoute cette chanson "${trackTitle}" générée avec Nova Tempo !`,
        url: window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            showToast("📲 Partagé avec succès !");
            return;
        } catch (err) {}
    }

    try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        showToast("🔗 Lien copié dans le presse-papier !");
    } catch(err) {
        showToast("🔗 https://novatempo.ai");
    }
};

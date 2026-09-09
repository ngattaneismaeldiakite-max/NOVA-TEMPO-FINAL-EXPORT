// track-actions.js

document.addEventListener("DOMContentLoaded", function() {
    // Inject Toast CSS
    const toastCSS = `
        <style>
            #toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .nova-toast {
                background: #ffffff;
                border-left: 4px solid #c90076;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                padding: 15px 25px;
                border-radius: 8px;
                font-family: 'Inter', sans-serif;
                font-weight: 700;
                color: #0a0a0a;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideInRight 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, fadeOut 0.5s 3s forwards;
            }
            @keyframes slideInRight {
                0% { transform: translateX(100%); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
        </style>
        <div id="toast-container"></div>
    `;
    document.body.insertAdjacentHTML('beforeend', toastCSS);

    // Bind event delegation for all icons on the page
    document.body.addEventListener('click', function(e) {
        // Find if the clicked element or its parent is a button
        const btn = e.target.closest('button');
        if (!btn) return;

        const title = btn.getAttribute('title');
        
        if (title === 'Télécharger' || title === 'Télécharger le MP3 HQ') {
            showToast("⏳ Préparation du téléchargement MP3...");
            setTimeout(() => {
                showToast("✅ Téléchargement de la musique terminé !");
                // Fake download by creating a blob
                const blob = new Blob(["Simulated MP3 file content"], { type: 'audio/mpeg' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = "Nova_Tempo_Track.mp3";
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            }, 1500);
        }
        
        if (title === 'Partager') {
            showToast("🔗 Lien de partage copié dans le presse-papier !");
            // Fake copy
            navigator.clipboard.writeText("https://novatempo.ai/track/XYZ-123").catch(err => {
                console.error("Clipboard API failed, ignoring.");
            });
        }
    });
});

window.showToast = function(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'nova-toast';
    toast.innerHTML = message;
    
    container.appendChild(toast);
    
    // Clean up DOM after animation finishes
    setTimeout(() => {
        if(toast.parentNode === container) {
            container.removeChild(toast);
        }
    }, 4000);
};

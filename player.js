// =====================================
// GLOBAL AUDIO PLAYER (NOVA TEMPO)
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    const playerCSS = `
        <style>
            .global-player {
                position: fixed;
                bottom: -120px;
                left: 0;
                width: 100%;
                height: 90px;
                background: rgba(255, 255, 255, 0.96);
                backdrop-filter: blur(20px);
                border-top: 1px solid #eaeaea;
                box-shadow: 0 -10px 40px rgba(0,0,0,0.08);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 30px;
                box-sizing: border-box;
                transition: bottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                font-family: 'Inter', sans-serif;
            }
            .global-player.active { bottom: 0; }

            .player-track-info { display: flex; align-items: center; gap: 15px; width: 30%; }
            .player-track-info img { width: 55px; height: 55px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
            .player-track-text h4 { margin: 0 0 4px 0; font-size: 15px; font-weight: 800; color: #0a0a0a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .player-track-text p { margin: 0; font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

            .player-controls-container { width: 40%; display: flex; flex-direction: column; align-items: center; gap: 6px; }
            .main-controls { display: flex; align-items: center; gap: 16px; }
            .control-btn { background: none; border: none; color: #0a0a0a; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
            .control-btn:hover { color: #0047AB; }
            
            .play-pause-btn {
                width: 44px; height: 44px; background: linear-gradient(135deg, #0047AB 0%, #E60023 100%);
                border-radius: 50%; color: white; border: none; display: flex; align-items: center; justify-content: center;
                cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 5px 15px rgba(0, 71, 171, 0.3);
            }
            .play-pause-btn:hover { transform: scale(1.08); box-shadow: 0 8px 25px rgba(0, 71, 171, 0.4); }

            .progress-container { width: 100%; display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 700; color: #666; }
            .progress-bar-bg { flex: 1; height: 6px; background: #eaeaea; border-radius: 3px; position: relative; cursor: pointer; overflow: hidden; }
            .progress-bar-fill { position: absolute; top: 0; left: 0; height: 100%; background: #0047AB; width: 0%; border-radius: 3px; transition: width 0.1s linear; }

            .player-actions { width: 30%; display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
            .action-btn { background: none; border: none; color: #666; cursor: pointer; transition: color 0.2s; padding: 6px; }
            .action-btn:hover { color: #0047AB; }

            @media (max-width: 768px) {
                .global-player { padding: 10px 15px; height: 80px; }
                .player-actions { display: none; }
                .player-track-info { width: 50%; }
                .player-controls-container { width: 50%; }
                .player-track-text p { display: none; }
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', playerCSS);

    const playerHTML = `
        <div id="nova-player" class="global-player">
            <div class="player-track-info">
                <img id="np-cover" src="hero.jpg" alt="Cover">
                <div class="player-track-text">
                    <h4 id="np-title">Nova Tempo Track</h4>
                    <p id="np-prompt">Généré par IA</p>
                </div>
            </div>
            <div class="player-controls-container">
                <div class="main-controls">
                    <button class="control-btn" title="Précédent" onclick="showToast('Piste précédente')"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line></svg></button>
                    <button id="np-play-btn" class="play-pause-btn" onclick="togglePlayPause()">
                        <svg id="np-play-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-left:3px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        <svg id="np-pause-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    </button>
                    <button class="control-btn" title="Suivant" onclick="showToast('Piste suivante')"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line></svg></button>
                </div>
                <div class="progress-container">
                    <span id="np-current-time">0:00</span>
                    <div class="progress-bar-bg" id="np-progress-bg" onclick="seekTrack(event)">
                        <div class="progress-bar-fill" id="np-progress-fill"></div>
                    </div>
                    <span id="np-duration">3:45</span>
                </div>
            </div>
            <div class="player-actions">
                <button class="action-btn" title="Partager" onclick="shareCurrentTrack()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
                <button class="action-btn" title="Télécharger MP3 HQ" onclick="downloadCurrentTrack()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', playerHTML);
});

let isPlaying = false;
let audioObj = null;
let fakeInterval = null;
let currentProgress = 0;
let trackDuration = 225;
let activeAudioUrl = null;
let activeTrackTitle = "Nova Tempo Track";

window.playTrack = function(title, prompt, coverSrc, audioUrl = null) {
    const player = document.getElementById('nova-player');
    if (player) player.classList.add('active');

    activeTrackTitle = title || "Nova Tempo Track";
    activeAudioUrl = audioUrl;

    const titleEl = document.getElementById('np-title');
    const promptEl = document.getElementById('np-prompt');
    const coverEl = document.getElementById('np-cover');

    if (titleEl) titleEl.textContent = activeTrackTitle;
    if (promptEl) promptEl.textContent = prompt || 'Généré par IA';
    if (coverEl && coverSrc) coverEl.src = coverSrc;

    if (audioObj) { 
        audioObj.pause(); 
        audioObj = null; 
    }
    if (fakeInterval) { 
        clearInterval(fakeInterval); 
        fakeInterval = null; 
    }

    currentProgress = 0;
    isPlaying = false;
    updatePlayIcon();
    
    if (audioUrl) {
        audioObj = new Audio(audioUrl);
        audioObj.addEventListener('timeupdate', () => {
            currentProgress = audioObj.currentTime;
            trackDuration = audioObj.duration || 1;
            updateProgressUI();
        });
        audioObj.addEventListener('ended', () => {
            isPlaying = false;
            updatePlayIcon();
            currentProgress = 0;
            updateProgressUI();
        });
        audioObj.addEventListener('loadedmetadata', () => {
            trackDuration = audioObj.duration;
            updateProgressUI();
        });
        togglePlayPause();
    } else {
        trackDuration = 225;
        updateProgressUI();
        togglePlayPause();
    }
};

window.togglePlayPause = function() {
    isPlaying = !isPlaying;
    updatePlayIcon();
    
    if (audioObj) {
        if (isPlaying) audioObj.play().catch(e => console.log("Audio play error:", e));
        else audioObj.pause();
    } else {
        if (isPlaying) {
            fakeInterval = setInterval(() => {
                currentProgress += 1;
                if (currentProgress >= trackDuration) {
                    currentProgress = 0;
                    togglePlayPause();
                }
                updateProgressUI();
            }, 1000);
        } else {
            clearInterval(fakeInterval);
        }
    }
};

function updatePlayIcon() {
    const playIcon = document.getElementById('np-play-icon');
    const pauseIcon = document.getElementById('np-pause-icon');
    if (playIcon) playIcon.style.display = isPlaying ? 'none' : 'block';
    if (pauseIcon) pauseIcon.style.display = isPlaying ? 'block' : 'none';
}

window.updateProgressUI = function() {
    if (isNaN(trackDuration) || trackDuration <= 0) trackDuration = 1;
    
    const cMin = Math.floor(currentProgress / 60);
    const cSec = Math.floor(currentProgress % 60);
    const curTimeStr = `${cMin}:${cSec < 10 ? '0' : ''}${cSec}`;
    const curTimeEl = document.getElementById('np-current-time');
    if (curTimeEl) curTimeEl.textContent = curTimeStr;
    
    const dMin = Math.floor(trackDuration / 60);
    const dSec = Math.floor(trackDuration % 60);
    const durTimeStr = `${dMin}:${dSec < 10 ? '0' : ''}${dSec}`;
    const durTimeEl = document.getElementById('np-duration');
    if (durTimeEl) durTimeEl.textContent = durTimeStr;
    
    const percentage = Math.min(100, (currentProgress / trackDuration) * 100);
    const fillEl = document.getElementById('np-progress-fill');
    if (fillEl) fillEl.style.width = percentage + '%';
};

window.seekTrack = function(e) {
    const bg = document.getElementById('np-progress-bg');
    if (!bg) return;
    const rect = bg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    currentProgress = percentage * trackDuration;
    
    if (audioObj) {
        audioObj.currentTime = currentProgress;
    }
    updateProgressUI();
};

window.shareCurrentTrack = function() {
    if (window.shareTrack) {
        window.shareTrack(activeTrackTitle, activeAudioUrl);
    } else {
        alert("Lien de la musique copié !");
    }
};

window.downloadCurrentTrack = function() {
    if (window.downloadMP3) {
        window.downloadMP3(activeTrackTitle, activeAudioUrl);
    } else {
        alert("Téléchargement du MP3 en cours...");
    }
};

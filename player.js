// =====================================
// GLOBAL AUDIO PLAYER (NOVA TEMPO)
// =====================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Injecter le CSS du lecteur
    const playerCSS = <style>
        .global-player {
            position: fixed;
            bottom: -120px;
            left: 0;
            width: 100%;
            height: 90px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-top: 1px solid #eaeaea;
            box-shadow: 0 -10px 40px rgba(0,0,0,0.05);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 40px;
            box-sizing: border-box;
            transition: bottom 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-family: 'Inter', sans-serif;
        }
        .global-player.active { bottom: 0; }

        .player-track-info { display: flex; align-items: center; gap: 15px; width: 30%; }
        .player-track-info img { width: 60px; height: 60px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .player-track-text h4 { margin: 0 0 5px 0; font-size: 16px; font-weight: 800; color: #0a0a0a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .player-track-text p { margin: 0; font-size: 12px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .player-controls-container { width: 40%; display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .main-controls { display: flex; align-items: center; gap: 20px; }
        .control-btn { background: none; border: none; color: #0a0a0a; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.2s; }
        .control-btn:hover { color: #c90076; }
        
        .play-pause-btn {
            width: 45px; height: 45px; background: linear-gradient(135deg, #7a00cc 0%, #c90076 50%, #ffb300 100%);
            border-radius: 50%; color: white; border: none; display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 5px 15px rgba(201, 0, 118, 0.3);
        }
        .play-pause-btn:hover { transform: scale(1.1); box-shadow: 0 8px 25px rgba(201, 0, 118, 0.4); }

        .progress-container { width: 100%; display: flex; align-items: center; gap: 10px; font-size: 11px; font-weight: 600; color: #666; }
        .progress-bar-bg { flex: 1; height: 6px; background: #eaeaea; border-radius: 3px; position: relative; cursor: pointer; overflow: hidden; }
        .progress-bar-fill { position: absolute; top: 0; left: 0; height: 100%; background: #c90076; width: 0%; border-radius: 3px; transition: width 0.1s linear; }

        .player-actions { width: 30%; display: flex; justify-content: flex-end; align-items: center; gap: 15px; }
        .action-btn { background: none; border: none; color: #666; cursor: pointer; transition: color 0.2s; }
        .action-btn:hover { color: #0a0a0a; }

        @media (max-width: 768px) {
            .global-player { padding: 10px 15px; bottom: -120px; }
            .player-actions { display: none; }
            .player-track-info { width: 50%; }
            .player-controls-container { width: 50%; }
            .player-track-text p { display: none; }
        }
    </style>;
    document.head.insertAdjacentHTML('beforeend', playerCSS);

    const playerHTML = \
        <div id="nova-player" class="global-player">
            <div class="player-track-info">
                <img id="np-cover" src="" alt="Cover">
                <div class="player-track-text">
                    <h4 id="np-title">Titre</h4>
                    <p id="np-prompt">Description...</p>
                </div>
            </div>
            <div class="player-controls-container">
                <div class="main-controls">
                    <button class="control-btn" title="Précédent"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line></svg></button>
                    <button id="np-play-btn" class="play-pause-btn" onclick="togglePlayPause()">
                        <svg id="np-play-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-left:3px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        <svg id="np-pause-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="display:none;"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                    </button>
                    <button class="control-btn" title="Suivant"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line></svg></button>
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
                <button class="action-btn" title="Volume"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg></button>
            </div>
        </div>
    \;
    document.body.insertAdjacentHTML('beforeend', playerHTML);
});

// Logic
let isPlaying = false;
let audioObj = null;
let fakeInterval = null;
let currentProgress = 0;
let trackDuration = 225; // default fake 3:45

window.playTrack = function(title, prompt, coverSrc, audioUrl = null) {
    const player = document.getElementById('nova-player');
    player.classList.add('active');

    document.getElementById('np-title').textContent = title;
    document.getElementById('np-prompt').textContent = prompt || 'Généré par IA';
    document.getElementById('np-cover').src = coverSrc || 'https://via.placeholder.com/150';

    if(audioObj) { audioObj.pause(); audioObj = null; }
    if(fakeInterval) { clearInterval(fakeInterval); fakeInterval = null; }

    currentProgress = 0;
    isPlaying = false;
    updatePlayIcon();
    
    if (audioUrl) {
        // VRAI LECTEUR AUDIO SI L'API RETOURNE UN FICHIER
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
        // SIMULATION SI PAS DE FICHIER
        trackDuration = 225;
        updateProgressUI();
        togglePlayPause();
    }
};

window.togglePlayPause = function() {
    isPlaying = !isPlaying;
    updatePlayIcon();
    
    if (audioObj) {
        if (isPlaying) audioObj.play();
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
    document.getElementById('np-play-icon').style.display = isPlaying ? 'none' : 'block';
    document.getElementById('np-pause-icon').style.display = isPlaying ? 'block' : 'none';
}

window.updateProgressUI = function() {
    if (isNaN(trackDuration)) trackDuration = 1;
    
    const cMin = Math.floor(currentProgress / 60);
    const cSec = Math.floor(currentProgress % 60);
    document.getElementById('np-current-time').textContent = \\:\\;
    
    const dMin = Math.floor(trackDuration / 60);
    const dSec = Math.floor(trackDuration % 60);
    document.getElementById('np-duration').textContent = \\:\\;
    
    const percentage = (currentProgress / trackDuration) * 100;
    document.getElementById('np-progress-fill').style.width = percentage + '%';
};

window.seekTrack = function(e) {
    const bg = document.getElementById('np-progress-bg');
    const rect = bg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    currentProgress = percentage * trackDuration;
    
    if (audioObj) {
        audioObj.currentTime = currentProgress;
    }
    updateProgressUI();
};
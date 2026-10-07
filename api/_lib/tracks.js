// api/_lib/tracks.js
// Suivi d'une chanson Suno jusqu'à sa sauvegarde (table tracks + Storage).

const { rest, rpc, uploadPublicFile } = require('./supabase');
const { signaler } = require('./erreurs');

const SUNO_API = 'https://api.sunoapi.org/api/v1';
const MAX_DURATION_MS = 15 * 60 * 1000; // au-delà : échec + remboursement

function sunoHeaders() {
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) throw new Error('SUNO_API_KEY manquante sur Vercel');
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
}

async function startSunoGeneration(payload) {
    const res = await fetch(`${SUNO_API}/generate`, {
        method: 'POST',
        headers: sunoHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || (data.code && data.code !== 200)) {
        throw new Error(`SunoAPI a refusé (${res.status}): ${data.msg || 'erreur inconnue'}`);
    }
    const taskId = data.data?.taskId || data.data?.task_id || data.taskId;
    if (!taskId) throw new Error('SunoAPI: identifiant de tâche absent');
    return taskId;
}

async function getSunoTask(taskId) {
    const res = await fetch(`${SUNO_API}/generate/record-info?taskId=${encodeURIComponent(taskId)}`, {
        headers: sunoHeaders()
    });
    const data = await res.json().catch(() => ({}));
    if (data.code && data.code !== 200) {
        throw new Error(`SunoAPI record-info: ${data.msg || res.status}`);
    }
    const info = data.data || {};
    const sunoData = info.response?.sunoData || info.sunoData || [];
    const ready = sunoData.find(s => s.audioUrl || s.audio_url);
    const status = String(info.status || '').toUpperCase();
    return {
        audioUrl: ready ? (ready.audioUrl || ready.audio_url) : null,
        failed: /FAIL|ERROR|SENSITIVE/.test(status),
        status,
        errorMessage: info.errorMessage || data.msg || status
    };
}

async function markFailed(track, reason) {
    const rows = await rest(`tracks?id=eq.${track.id}&statut=in.(pending,processing)`, {
        method: 'PATCH',
        prefer: 'return=representation',
        body: { statut: 'failed', erreur: String(reason).slice(0, 500), updated_at: new Date().toISOString() }
    });
    // Rembourser une seule fois : seulement si c'est nous qui avons fait passer la chanson en échec.
    if (rows && rows.length) {
        await rpc('refund_credit', { p_user: track.user_id });
    }
}

async function copyAudioToStorage(track, sunoUrl) {
    try {
        const audioRes = await fetch(sunoUrl);
        if (!audioRes.ok) throw new Error(`téléchargement ${audioRes.status}`);
        const buffer = Buffer.from(await audioRes.arrayBuffer());
        return await uploadPublicFile('tracks', `${track.user_id}/${track.id}.mp3`, buffer, 'audio/mpeg');
    } catch (err) {
        // On garde le lien Suno (valable 14 jours) plutôt que de perdre la chanson.
        await signaler('copie-audio', `Copie audio ${track.id} impossible: ${err.message}`);
        return sunoUrl;
    }
}

// Fait avancer une chanson "processing". Retourne la ligne tracks à jour.
async function refreshTrack(track) {
    if (track.statut !== 'processing' || !track.suno_task_id) return track;

    const task = await getSunoTask(track.suno_task_id);

    if (task.audioUrl) {
        const finalUrl = await copyAudioToStorage(track, task.audioUrl);
        const rows = await rest(`tracks?id=eq.${track.id}&statut=eq.processing`, {
            method: 'PATCH',
            prefer: 'return=representation',
            body: { statut: 'completed', url_audio: finalUrl, updated_at: new Date().toISOString() }
        });
        return rows && rows.length ? rows[0] : (await rest(`tracks?id=eq.${track.id}&select=*`))[0];
    }

    const tooOld = Date.now() - new Date(track.created_at).getTime() > MAX_DURATION_MS;
    if (task.failed || tooOld) {
        await markFailed(track, task.failed ? task.errorMessage : 'Délai de génération dépassé');
        return { ...track, statut: 'failed' };
    }

    return track;
}

module.exports = { startSunoGeneration, refreshTrack, markFailed };

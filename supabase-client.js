// ==========================================
// SUPABASE BACKEND INTEGRATION - NOVA TEMPO
// ==========================================
const SUPABASE_URL = 'https://wxkeuyyppzuqplnutwzk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DrMH4qQCF4s1KyoPjvlJeA_puXHR_rr';

if (!window.supabase) {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    document.head.appendChild(script);
    
    script.onload = () => {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        checkUserAuth();
    };
}

async function checkUserAuth() {
    if (!window.supabaseClient) return;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    const isPublicPage = window.location.pathname.includes('index.html') || window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');
    
    if (!session && !isPublicPage) {
        window.location.href = 'login.html';
    } else if (session) {
        const user = session.user;
        const usernameEls = document.querySelectorAll('.display-username');
        usernameEls.forEach(el => el.textContent = user.user_metadata.full_name || 'Utilisateur');
    }
}

// LA FAMEUSE FONCTION QUI SAUVEGARDE LA MUSIQUE
async function saveTrackToDatabase(trackData) {
    if (!window.supabaseClient) return;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;
    
    const { error } = await window.supabaseClient.from('tracks').insert([{
        user_id: session.user.id,
        titre: trackData.titre,
        occasion: trackData.occasion,
        style_musical: trackData.style_musical,
        url_audio: trackData.url_audio,
        paroles: trackData.paroles
    }]);
    
    if (error) console.error("Erreur sauvegarde piste:", error);
}

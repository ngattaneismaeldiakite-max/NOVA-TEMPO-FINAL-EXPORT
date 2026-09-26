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
    
    // Si l'utilisateur revient d'une redirection GeniusPay / Mobile Money, ne pas le déconnecter
    const isPaymentReturn = window.location.search.includes('status=') || window.location.search.includes('payment=') || window.location.search.includes('trx=') || window.location.search.includes('error=');

    if (!session && !isPublicPage && !isPaymentReturn) {
        // Délais de grâce avant de rediriger
        setTimeout(async () => {
            const { data: { session: retrySession } } = await window.supabaseClient.auth.getSession();
            if (!retrySession) {
                window.location.href = 'login.html';
            }
        }, 1200);
    } else if (session) {
        const user = session.user;
        const usernameEls = document.querySelectorAll('.display-username');
        usernameEls.forEach(el => el.textContent = user.user_metadata?.full_name || 'Utilisateur');
    }
}

// SAUVEGARDE DE LA MUSIQUE DANS SUPABASE
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

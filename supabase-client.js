// ==========================================
// SUPABASE BACKEND INTEGRATION - NOVA TEMPO
// ==========================================
const SUPABASE_URL = 'https://wxkeuyyppzuqplnutwzk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DrMH4qQCF4s1KyoPjvlJeA_puXHR_rr';

function initSupabaseClient() {
    if (window.supabase && !window.supabaseClient) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
}

// Initialisation immédiate ou sur chargement du script SDK
if (window.supabase) {
    initSupabaseClient();
    setTimeout(checkUserAuth, 300);
} else {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    document.head.appendChild(script);
    
    script.onload = () => {
        initSupabaseClient();
        setTimeout(checkUserAuth, 300);
    };
}

async function checkUserAuth() {
    initSupabaseClient();
    if (!window.supabaseClient) return;
    
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        const currentPath = window.location.pathname.toLowerCase();
        const isPublicPage = currentPath.endsWith('/') || 
                             currentPath.includes('index.html') || 
                             currentPath.includes('login.html') || 
                             currentPath.includes('signup.html');
        
        // Détecter si l'utilisateur revient d'une tentative de paiement Mobile Money ou possède un jeton stocké
        const isPaymentReturn = window.location.search.includes('status=') || 
                                window.location.search.includes('payment=') || 
                                window.location.search.includes('trx=') || 
                                window.location.search.includes('error=') ||
                                sessionStorage.getItem('nova_in_payment') === 'true';
        
        const hasLocalAuthToken = Object.keys(localStorage).some(k => k.includes('-auth-token'));

        if (!session && !isPublicPage && !isPaymentReturn && !hasLocalAuthToken) {
            // Laisser un délai de grâce pour la restauration de la session en mémoire
            setTimeout(async () => {
                const { data: { session: retrySession } } = await window.supabaseClient.auth.getSession();
                const stillHasToken = Object.keys(localStorage).some(k => k.includes('-auth-token'));
                if (!retrySession && !isPublicPage && !stillHasToken && sessionStorage.getItem('nova_in_payment') !== 'true') {
                    window.location.href = 'login.html';
                }
            }, 1500);
        } else if (session) {
            const user = session.user;
            const usernameEls = document.querySelectorAll('.display-username');
            usernameEls.forEach(el => el.textContent = user.user_metadata?.full_name || 'Utilisateur');
        }
    } catch(e) {
        console.error("Erreur vérification Auth Supabase:", e);
    }
}

// SAUVEGARDE DE LA MUSIQUE DANS SUPABASE
async function saveTrackToDatabase(trackData) {
    initSupabaseClient();
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

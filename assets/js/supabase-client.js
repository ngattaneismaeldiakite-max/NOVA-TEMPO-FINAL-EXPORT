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
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js"; script.integrity = "sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok"; script.crossOrigin = "anonymous";
    document.head.appendChild(script);
    
    script.onload = () => {
        initSupabaseClient();
        setTimeout(checkUserAuth, 300);
    };
}

async function checkUserAuth() {
    initSupabaseClient();
    if (!window.supabaseClient) return;
    
    // Ecouter les changements d'état d'authentification (ex: retour de Google OAuth)
    if (!window._authListenerAttached) {
        window._authListenerAttached = true;
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            const path = window.location.pathname.toLowerCase();
            if (session && (path.includes('login.html') || path.includes('signup.html'))) {
                window.location.href = 'studio.html';
            }
        });
    }

    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        const currentPath = window.location.pathname.toLowerCase();
        const isAuthPage = currentPath.includes('login.html') || currentPath.includes('signup.html');
        const isPublicPage = currentPath.endsWith('/') || currentPath.includes('index.html') || isAuthPage;
        
        // Si l'utilisateur est connecté et se trouve sur login/signup, le rediriger au Studio
        if (session && isAuthPage) {
            window.location.href = 'studio.html';
            return;
        }

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


// ==========================================
// SUPABASE BACKEND INTEGRATION - NOVA TEMPO
// ==========================================
// 1. Pour activer ce backend, vous devez remplacer les deux variables ci-dessous 
// par vos clés Supabase (Project URL et Anon Key).
const SUPABASE_URL = 'https://VOTRE_PROJET.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR...VOTRE_CLE_ANON...';

// Load Supabase SDK dynamically if not present
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
    
    // Protection des pages privées
    const isPublicPage = window.location.pathname.includes('index.html') || window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html');
    
    if (!session && !isPublicPage) {
        window.location.href = 'login.html';
    } else if (session) {
        // Mettre à jour l'UI avec l'utilisateur connecté
        const user = session.user;
        const usernameEls = document.querySelectorAll('.display-username');
        usernameEls.forEach(el => el.textContent = user.user_metadata.full_name || 'Utilisateur');
        
        // Fetch credits from profiles table
        fetchCredits(user.id);
    }
}

async function fetchCredits(userId) {
    if (!window.supabaseClient) return;
    const { data, error } = await window.supabaseClient.from('profiles').select('credits').eq('id', userId).single();
    if (data) {
        updateCreditsUI(data.credits);
    }
}

function updateCreditsUI(amount) {
    const creditEls = document.querySelectorAll('.display-credits');
    creditEls.forEach(el => el.innerHTML = \ <span style="font-size:12px;">Crédits</span>);
}

// Fonction globale appelée par le Studio lors de la génération
async function deductCredits(amount) {
    if (!window.supabaseClient) {
        // Fallback local storage si Supabase n'est pas encore configuré
        let current = parseInt(localStorage.getItem('nova_credits') || '150');
        current -= amount;
        localStorage.setItem('nova_credits', current);
        updateCreditsUI(current);
        return true;
    }
    
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return false;
    
    // Logique RPC (Remote Procedure Call) pour déduire les crédits côté serveur en toute sécurité
    const { data, error } = await window.supabaseClient.rpc('deduct_credits', { user_id: session.user.id, deduct_amount: amount });
    if (!error) {
        updateCreditsUI(data);
        return true;
    }
    return false;
}

// Fonction globale pour sauvegarder une piste
async function saveTrackToDatabase(trackData) {
    if (!window.supabaseClient) return; // Fallback localStorage déjà géré dans studio.html
    
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) return;
    
    const { error } = await window.supabaseClient.from('tracks').insert([
        {
            user_id: session.user.id,
            title: trackData.title,
            prompt: trackData.prompt,
            cover_url: trackData.cover,
            audio_url: trackData.audio_url || null,
            created_at: new Date()
        }
    ]);
    if (error) console.error("Erreur sauvegarde piste:", error);
}

// Exécuter le fallback local au chargement si Supabase n'est pas prêt
document.addEventListener('DOMContentLoaded', () => {
    if (!window.supabaseClient) {
        let current = localStorage.getItem('nova_credits') || '150';
        updateCreditsUI(current);
    }
});


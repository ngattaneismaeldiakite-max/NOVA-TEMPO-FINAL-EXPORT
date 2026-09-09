// payment-widget.js

const OFFERS = {
    "essai": { name: "Essai (1 Chanson)", price: 1500 },
    "duo": { name: "Duo (2 Chansons)", price: 2700 },
    "collection": { name: "Collection (5 Chansons)", price: 6000 }
};

let currentOfferId = "essai";

document.addEventListener("DOMContentLoaded", function() {
    const paymentCSS = `
        <style>
            .payment-overlay {
                display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.6); z-index: 9999; justify-content: center; align-items: center;
                backdrop-filter: blur(5px);
            }
            .payment-modal {
                background: #ffffff; width: 90%; max-width: 450px; border-radius: 24px; padding: 30px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.2); position: relative; font-family: 'Inter', sans-serif;
                animation: slideUpModal 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes slideUpModal { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            
            .payment-close {
                position: absolute; top: 20px; right: 20px; background: none; border: none;
                font-size: 28px; cursor: pointer; color: #999; transition: color 0.2s; line-height: 1;
            }
            .payment-close:hover { color: #333; }
            
            .payment-title { font-weight: 800; font-size: 24px; color: #0a0a0a; margin-top:0; margin-bottom: 25px; letter-spacing: -0.02em; }
            
            .offer-summary {
                background: rgba(241, 90, 36, 0.05); border: 2px solid var(--primary-magenta); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;
            }
            .offer-name { font-size: 18px; font-weight: 700; color: var(--primary-magenta); margin-bottom: 5px; }
            .offer-price { font-size: 28px; font-weight: 900; color: #0a0a0a; }
            
            .momo-providers {
                display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;
            }
            .momo-btn { font-family: 'Inter', sans-serif;
                background: #f7f7f8; border: 1px solid #eaeaea; border-radius: 12px; padding: 12px;
                font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s;
                display: flex; align-items: center; justify-content: center; gap: 10px; color: #0a0a0a;
            }
            .momo-btn:hover, .momo-btn.active {
                background: #ffffff; border-color: var(--primary-magenta); box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            }
            .phone-input-group { margin-bottom: 25px; }
            .phone-input {
                width: 100%; box-sizing: border-box; padding: 15px; border-radius: 12px; border: 1px solid #eaeaea;
                font-family: 'Inter', sans-serif; font-size: 16px; outline: none; transition: all 0.3s;
            }
            .phone-input:focus { border-color: var(--primary-magenta); box-shadow: 0 0 0 3px rgba(241, 90, 36, 0.1); }
            
            .pay-submit-btn { font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #7a00cc 0%, var(--primary-magenta) 50%, #ffb300 100%);
                color: white; border: none; padding: 16px; font-size: 16px; font-weight: 800;
                border-radius: 12px; width: 100%; cursor: pointer; transition: all 0.3s;
                box-shadow: 0 10px 25px rgba(241, 90, 36, 0.3);
            }
            .pay-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(241, 90, 36, 0.4); }
            .pay-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
            
            /* Loader spinner */
            .spinner {
                border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #fff; border-radius: 50%;
                width: 20px; height: 20px; animation: spin 1s linear infinite; display: inline-block; vertical-align: middle;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', paymentCSS);

    const paymentHTML = `
        <div id="payment-modal" class="payment-overlay">
            <div class="payment-modal">
                <button class="payment-close" onclick="closePaymentModal()">&times;</button>
                <h2 class="payment-title">Recharger votre compte</h2>
                
                <div id="payment-step-1">
                    <div class="offer-summary">
                        <div id="modal-offer-name" class="offer-name">Essai (1 Chanson)</div>
                        <div id="modal-offer-price" class="offer-price">1 500 FCFA</div>
                    </div>
                    
                    <p style="font-size:13px; font-weight:700; color:#666; margin-bottom:12px;">Moyen de paiement</p>
                    <div class="momo-providers">
                        <button class="momo-btn active" onclick="selectProvider(this)"><img src="logo_wave.jpg" alt="Wave" style="width: 24px; height: 24px; object-fit: contain; border-radius: 4px;"> Wave</button>
                        <button class="momo-btn" onclick="selectProvider(this)"><img src="logo_orange.jpg" alt="Orange Money" style="width: 24px; height: 24px; object-fit: contain; border-radius: 4px;"> Orange</button>
                        <button class="momo-btn" onclick="selectProvider(this)"><img src="logo_mtn.jpg" alt="MTN MoMo" style="width: 24px; height: 24px; object-fit: contain; border-radius: 4px;"> MTN</button>
                        <button class="momo-btn" onclick="selectProvider(this)"><img src="logo_moov.jpg" alt="Moov Money" style="width: 24px; height: 24px; object-fit: contain; border-radius: 4px;"> Moov</button>
                    </div>
                    
                    <div class="phone-input-group">
                        <input type="tel" id="momo-phone" class="phone-input" placeholder="Numéro de téléphone (ex: 0102030405)">
                    </div>
                    
                    <button id="pay-btn" class="pay-submit-btn" onclick="processPayment()">Payer 1 500 FCFA</button>
                </div>
                
                <div id="payment-success" style="display: none; text-align: center; padding: 20px 0;">
                    <div style="margin-bottom: 20px;"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
                    <h3 style="font-size: 22px; color: #0a0a0a; margin-bottom: 10px; font-weight: 800;">Paiement Réussi !</h3>
                    <p style="color: #666; font-size: 15px; line-height: 1.5; margin-bottom: 25px;">Vos chansons ont été ajoutées à votre compte. Laissez parler votre créativité !</p>
                    <button onclick="closePaymentModalAndRefresh()" class="pay-submit-btn" style="width: 100%;">Continuer</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', paymentHTML);
    
    // Check if we came from index.html with a plan
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    if (plan && OFFERS[plan]) {
        openPaymentModal(plan);
        // Clear the param so it doesn't reopen on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

window.openPaymentModal = function(offerId) {
    if (!offerId || !OFFERS[offerId]) offerId = 'essai';
    currentOfferId = offerId;
    const offer = OFFERS[offerId];
    
    // Update modal UI
    const modalName = document.getElementById('modal-offer-name');
    const modalPrice = document.getElementById('modal-offer-price');
    const payBtn = document.getElementById('pay-btn');
    
    if (modalName) modalName.textContent = offer.name;
    if (modalPrice) modalPrice.textContent = offer.price.toLocaleString('fr-FR') + " FCFA";
    if (payBtn) payBtn.textContent = "Payer " + offer.price.toLocaleString('fr-FR') + " FCFA";
    
    document.getElementById('payment-modal').style.display = 'flex';
    document.getElementById('payment-step-1').style.display = 'block';
    document.getElementById('payment-success').style.display = 'none';
};

window.closePaymentModal = function() {
    document.getElementById('payment-modal').style.display = 'none';
};

window.closePaymentModalAndRefresh = function() {
    closePaymentModal();
    // Simulate updating balance via frontend
    alert("Paiement validé côté serveur via l'API Vercel !");
    location.reload(); 
};

window.selectProvider = function(element) {
    document.querySelectorAll('.momo-btn').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
};

window.processPayment = function() {
    const phone = document.getElementById('momo-phone').value;
    if (!phone || phone.length < 8) {
        alert("Veuillez entrer un numéro de téléphone valide.");
        return;
    }
    
    const btn = document.getElementById('pay-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Traitement en cours...';
    
    // Simulation frontend : ici on appellerait /api/payments/initiate 
    setTimeout(() => {
        document.getElementById('payment-step-1').style.display = 'none';
        document.getElementById('payment-success').style.display = 'block';
    }, 2500);
};

// payment-widget.js
// Widget de paiement Nova Tempo avec support GeniusPay & Mobile Money (Wave, Orange, MTN, Moov)

const OFFERS = {
    "essai": { id: "essai", name: "Essai (1 Chanson)", price: 1500, credits: 50 },
    "duo": { id: "duo", name: "Duo (2 Chansons)", price: 2700, credits: 100 },
    "collection": { id: "collection", name: "Collection (5 Chansons)", price: 6000, credits: 250 }
};

let currentOfferId = "essai";
let selectedProvider = "wave";

document.addEventListener("DOMContentLoaded", function() {
    const paymentCSS = `
        <style>
            .payment-overlay {
                display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.65); z-index: 9999; justify-content: center; align-items: center;
                backdrop-filter: blur(8px);
            }
            .payment-modal {
                background: #ffffff; width: 90%; max-width: 450px; border-radius: 24px; padding: 30px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.25); position: relative; font-family: 'Inter', sans-serif;
                animation: slideUpModal 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes slideUpModal { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            
            .payment-close {
                position: absolute; top: 20px; right: 20px; background: none; border: none;
                font-size: 28px; cursor: pointer; color: #999; transition: color 0.2s; line-height: 1;
            }
            .payment-close:hover { color: #333; }
            
            .payment-title { font-weight: 800; font-size: 22px; color: #0a0a0a; margin-top:0; margin-bottom: 20px; letter-spacing: -0.02em; }
            
            .offer-summary {
                background: rgba(0, 71, 171, 0.05); border: 2px solid #0047AB; border-radius: 14px; padding: 18px; margin-bottom: 20px; text-align: center;
            }
            .offer-name { font-size: 16px; font-weight: 700; color: #0047AB; margin-bottom: 4px; }
            .offer-price { font-size: 26px; font-weight: 900; color: #0a0a0a; }
            
            .momo-providers {
                display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;
            }
            .momo-btn { font-family: 'Inter', sans-serif;
                background: #f7f7f8; border: 2px solid #eaeaea; border-radius: 12px; padding: 12px;
                font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s;
                display: flex; align-items: center; justify-content: center; gap: 8px; color: #0a0a0a;
            }
            .momo-btn:hover, .momo-btn.active {
                background: #ffffff; border-color: #0047AB; box-shadow: 0 4px 15px rgba(0,71,171,0.12);
            }
            .phone-input-group { margin-bottom: 20px; }
            .phone-input {
                width: 100%; box-sizing: border-box; padding: 14px; border-radius: 12px; border: 1.5px solid #eaeaea;
                font-family: 'Inter', sans-serif; font-size: 15px; outline: none; transition: all 0.3s;
            }
            .phone-input:focus { border-color: #0047AB; box-shadow: 0 0 0 3px rgba(0, 71, 171, 0.12); }
            
            .pay-submit-btn { font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #0047AB 0%, #E60023 100%);
                color: white; border: none; padding: 16px; font-size: 16px; font-weight: 800;
                border-radius: 12px; width: 100%; cursor: pointer; transition: all 0.3s;
                box-shadow: 0 10px 25px rgba(0, 71, 171, 0.3);
            }
            .pay-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(0, 71, 171, 0.4); }
            .pay-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
            
            .spinner-inline {
                border: 3px solid rgba(255,255,255,0.3); border-top: 3px solid #fff; border-radius: 50%;
                width: 18px; height: 18px; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', paymentCSS);

    const paymentHTML = `
        <div id="payment-modal" class="payment-overlay">
            <div class="payment-modal">
                <button class="payment-close" onclick="closePaymentModal()">&times;</button>
                <h2 class="payment-title">Recharger avec Mobile Money</h2>
                
                <div id="payment-step-1">
                    <div class="offer-summary">
                        <div id="modal-offer-name" class="offer-name">Essai (1 Chanson)</div>
                        <div id="modal-offer-price" class="offer-price">1 500 FCFA</div>
                    </div>
                    
                    <p style="font-size:13px; font-weight:700; color:#666; margin-bottom:10px;">Choisir le moyen de paiement</p>
                    <div class="momo-providers">
                        <button type="button" class="momo-btn active" data-provider="wave" onclick="selectProvider(this)"><img src="logo_wave.jpg" alt="Wave" style="width: 22px; height: 22px; object-fit: contain; border-radius: 4px;"> Wave</button>
                        <button type="button" class="momo-btn" data-provider="orange" onclick="selectProvider(this)"><img src="logo_orange.jpg" alt="Orange Money" style="width: 22px; height: 22px; object-fit: contain; border-radius: 4px;"> Orange</button>
                        <button type="button" class="momo-btn" data-provider="mtn" onclick="selectProvider(this)"><img src="logo_mtn.jpg" alt="MTN MoMo" style="width: 22px; height: 22px; object-fit: contain; border-radius: 4px;"> MTN</button>
                        <button type="button" class="momo-btn" data-provider="moov" onclick="selectProvider(this)"><img src="logo_moov.jpg" alt="Moov Money" style="width: 22px; height: 22px; object-fit: contain; border-radius: 4px;"> Moov</button>
                    </div>
                    
                    <div class="phone-input-group">
                        <input type="tel" id="momo-phone" class="phone-input" placeholder="Numéro de téléphone (ex: 0701020304)">
                    </div>
                    
                    <button id="pay-btn" type="button" class="pay-submit-btn" onclick="processPayment()">Payer 1 500 FCFA</button>
                </div>
                
                <div id="payment-success" style="display: none; text-align: center; padding: 20px 0;">
                    <div style="margin-bottom: 15px;"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
                    <h3 style="font-size: 22px; color: #0a0a0a; margin-bottom: 10px; font-weight: 800;">Demande de paiement transmise !</h3>
                    <p style="color: #666; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">Veuillez valider le paiement sur votre téléphone. Vos crédits seront crédités immédiatement dès confirmation GeniusPay.</p>
                    <button type="button" onclick="closePaymentModalAndRefresh()" class="pay-submit-btn" style="width: 100%;">Terminer</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', paymentHTML);
    
    // Auto open if query param plan is passed
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    if (plan && OFFERS[plan]) {
        openPaymentModal(plan);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

window.openPaymentModal = function(offerId) {
    if (!offerId || !OFFERS[offerId]) offerId = 'essai';
    currentOfferId = offerId;
    const offer = OFFERS[offerId];
    
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
    location.reload(); 
};

window.selectProvider = function(element) {
    document.querySelectorAll('.momo-btn').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    selectedProvider = element.getAttribute('data-provider') || 'wave';
};

window.processPayment = async function() {
    const phone = document.getElementById('momo-phone').value.trim();
    if (!phone || phone.length < 8) {
        alert("Veuillez entrer un numéro de téléphone valide.");
        return;
    }
    
    const btn = document.getElementById('pay-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-inline"></span> Initialisation GeniusPay...';
    
    try {
        let userId = 'user-guest';
        if (window.supabaseClient) {
            const { data } = await window.supabaseClient.auth.getUser();
            if (data && data.user) {
                userId = data.user.id;
            }
        }
        
        const response = await fetch('/api/payments/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                offer_id: currentOfferId,
                phone_number: phone,
                payment_method: selectedProvider
            })
        });
        
        const resData = await response.json();
        
        if (resData.success) {
            document.getElementById('payment-step-1').style.display = 'none';
            document.getElementById('payment-success').style.display = 'block';
        } else {
            alert("Erreur lors de l'initialisation : " + (resData.error || "Impossible d'initier le paiement"));
        }
    } catch (err) {
        console.error("Erreur paiement:", err);
        document.getElementById('payment-step-1').style.display = 'none';
        document.getElementById('payment-success').style.display = 'block';
    } finally {
        btn.disabled = false;
    }
};

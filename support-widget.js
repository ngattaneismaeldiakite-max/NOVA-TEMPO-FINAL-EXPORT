// support-widget.js

document.addEventListener("DOMContentLoaded", function() {
    // 1. Inject Floating Button
    const floatingBtnHTML = `
        <button onclick="openSupportModal()" title="Contacter le support" style="position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; background: linear-gradient(135deg, var(--primary-magenta) 0%, var(--primary-magenta) 50%, #ffb300 100%); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 10px 25px rgba(241, 90, 36, 0.4); cursor: pointer; z-index: 999; border: none; transition: all 0.3s;" onmouseover="this.style.transform='scale(1.1) translateY(-5px)'; this.style.boxShadow='0 15px 35px rgba(241, 90, 36, 0.5)';" onmouseout="this.style.transform='scale(1) translateY(0)'; this.style.boxShadow='0 10px 25px rgba(241, 90, 36, 0.4)';">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        </button>
    `;

    // 2. Inject Modal HTML
    const modalHTML = `
        <div id="support-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center; backdrop-filter: blur(5px);">
            <div style="background: #ffffff; width: 90%; max-width: 500px; border-radius: 24px; padding: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); position: relative; font-family: 'Inter', sans-serif;">
                <button onclick="closeSupportModal()" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 28px; cursor: pointer; color: #666; line-height: 1;">&times;</button>
                <h2 style="font-weight: 800; font-size: 24px; color: #0a0a0a; margin-top:0; letter-spacing: -0.02em; margin-bottom: 20px;">Support Client <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-magenta)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-left: 8px;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg></h2>
                
                <div id="support-form-container">
                    <div style="margin-bottom: 15px;">
                        <label style="display:block; font-weight:700; font-size:14px; margin-bottom:8px; color:#666;">Sujet</label>
                        <input type="text" id="support-subject" placeholder="Sujet de votre demande..." style="width:100%; box-sizing:border-box; padding:15px; border-radius:12px; border:1px solid #eaeaea; font-family:'Inter', sans-serif; font-size: 15px; color: #0a0a0a; background: #ffffff; outline: none; box-shadow: 0 2px 5px rgba(0,0,0,0.02);" onfocus="this.style.borderColor='var(--primary-magenta)'; this.style.boxShadow='0 0 0 3px rgba(241, 90, 36, 0.1)';" onblur="this.style.borderColor='#eaeaea'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.02)';">
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display:block; font-weight:700; font-size:14px; margin-bottom:8px; color:#666;">Votre message</label>
                        <textarea id="support-message" placeholder="Décrivez votre problème ou votre recommandation..." style="width:100%; box-sizing:border-box; padding:15px; border-radius:12px; border:1px solid #eaeaea; font-family:'Inter', sans-serif; font-size: 15px; color: #0a0a0a; min-height: 120px; resize: vertical; box-shadow: 0 2px 5px rgba(0,0,0,0.02); outline: none;" onfocus="this.style.borderColor='var(--primary-magenta)'; this.style.boxShadow='0 0 0 3px rgba(241, 90, 36, 0.1)';" onblur="this.style.borderColor='#eaeaea'; this.style.boxShadow='0 2px 5px rgba(0,0,0,0.02)';"></textarea>
                    </div>
                    <button id="support-submit-btn" onclick="submitSupportForm()" style="font-family:'Inter', sans-serif; background: linear-gradient(135deg, var(--primary-magenta) 0%, var(--primary-magenta) 50%, #ffb300 100%); color: white; border: none; padding:15px; font-size:15px; font-weight: 800; border-radius:12px; width:100%; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';">Envoyer le message</button>
                </div>
                
                <!-- Message de succès (caché par défaut) -->
                <div id="support-success-message" style="display: none; text-align: center; padding: 20px 0;">
                    <div style="margin-bottom: 15px;"><svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg></div>
                    <h3 style="font-size: 20px; color: #0a0a0a; margin-bottom: 10px;">Message Envoyé !</h3>
                    <p style="color: #666; font-size: 14px; line-height: 1.5;">Notre équipe a bien reçu votre demande. Nous vous répondrons par e-mail dans les plus brefs délais (généralement sous 24h).</p>
                    <button onclick="closeSupportModal()" style="margin-top: 20px; width: 100%; background: rgba(241, 90, 36, 0.08); border: 1px solid rgba(241, 90, 36, 0.2); color: var(--primary-magenta); padding: 12px; font-size: 15px; font-weight: 700; border-radius: 12px; cursor: pointer;">Fermer</button>
                </div>
            </div>
        </div>
    `;

    // 3. Prevent duplicate injection if widget is already embedded manually
    if (!document.getElementById('support-modal')) {
        document.body.insertAdjacentHTML('beforeend', floatingBtnHTML + modalHTML);
    } else {
        document.body.insertAdjacentHTML('beforeend', floatingBtnHTML);
    }
});

// Global functions for the modal
window.openSupportModal = function() {
    const modal = document.getElementById('support-modal');
    if(modal) {
        modal.style.display = 'flex';
        document.getElementById('support-form-container').style.display = 'block';
        document.getElementById('support-success-message').style.display = 'none';
    }
};

window.closeSupportModal = function() {
    const modal = document.getElementById('support-modal');
    if(modal) modal.style.display = 'none';
};

window.submitSupportForm = function() {
    const subject = document.getElementById('support-subject').value;
    const message = document.getElementById('support-message').value;
    const btn = document.getElementById('support-submit-btn');
    
    if (!subject.trim()) {
        alert("Veuillez entrer un sujet.");
        return;
    }
    
    if (!message.trim()) {
        alert("Veuillez entrer un message.");
        return;
    }

    btn.textContent = 'Envoi en cours...';
    btn.style.opacity = '0.7';
    btn.disabled = true;

    // Décodage de l'email
    const targetEmail = atob("bmdhdHRhbmVpc21hZWxkaWFraXRlQGdtYWlsLmNvbQ==");
    
    // FormSubmit AJAX API
    fetch("https://formsubmit.co/ajax/" + targetEmail, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            _subject: "Support Nova Tempo : " + subject,
            Sujet: subject,
            Message: message,
            Utilisateur: localStorage.getItem('nova_username') || 'Non connecté',
            Email: localStorage.getItem('nova_email') || 'Non renseigné'
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('support-form-container').style.display = 'none';
        document.getElementById('support-success-message').style.display = 'block';
        btn.textContent = 'Envoyer le message';
        btn.style.opacity = '1';
        btn.disabled = false;
        document.getElementById('support-message').value = '';
        document.getElementById('support-subject').value = '';
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Une erreur est survenue lors de l'envoi.");
        btn.textContent = 'Envoyer le message';
        btn.style.opacity = '1';
        btn.disabled = false;
    });
};

document.addEventListener("DOMContentLoaded", () => {
    // --- Animations douces au dÃ©filement (Scroll) ---
    // Cette fonction dÃ©tecte quand un Ã©lÃ©ment apparaÃ®t Ã  l'Ã©cran
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, { threshold: 0.1 }); // Se dÃ©clenche quand 10% de l'Ã©lÃ©ment est visible

    // On prÃ©pare les Ã©lÃ©ments pour l'animation (Ã‰tapes, Tarifs, TÃ©moignages)
    const elementsToAnimate = document.querySelectorAll(".step, .plan, .testimonial-card");
    
    elementsToAnimate.forEach((el) => {
        // Ã‰tat initial (invisible et lÃ©gÃ¨rement dÃ©calÃ© vers le bas)
        el.style.opacity = 0;
        el.style.transform = "translateY(30px)";
        el.style.transition = "all 0.6s ease-out";
        
        // On demande Ã  l'observateur de surveiller cet Ã©lÃ©ment
        observer.observe(el);
    });

});

// Load global avatar on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedAvatar = localStorage.getItem('nova_user_avatar');
    if (savedAvatar) {
        const displayAvatars = document.querySelectorAll('.display-avatar');
        displayAvatars.forEach(av => {
            av.innerHTML = <img src=" + savedAvatar + " style="width:100%; height:100%; border-radius:50%; object-fit:cover;">;
        });
        
        // Also update preview in parametres if present
        const preview = document.getElementById('profile-image-preview');
        const initial = document.getElementById('profile-initial');
        if (preview && initial) {
            preview.src = savedAvatar;
            preview.style.display = 'block';
            initial.style.display = 'none';
        }
    }
});
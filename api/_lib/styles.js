// api/_lib/styles.js
// Styles et voix proposés dans le Studio, avec leur description envoyée à Suno.
// Partagé par la création d'une chanson et par la file d'attente (qui relance une chanson depuis la base).

const STYLES = {
    'Coupé Décalé': 'ivorian coupe decale, atalaku, fast tempo, festive animation, sebene guitar, log drum',
    'Amapiano': 'amapiano, deep log drum, south african vibe, groovy shaker, party',
    'Afrobeat': 'afrobeat, naija groove, smooth percussion, saxophone',
    'Ndombolo': 'ndombolo, congolese rumba, sebene guitar, fast dance',
    'Rap Français': 'french rap, trap beat, heavy 808, punchy drill',
    'Zouk': 'zouk, kizomba, romantic, slow dance, smooth',
    'Gospel': 'gospel choir, uplifting, emotional, spiritual, powerful vocals, organ'
};
const VOICES = { male: 'male vocal', female: 'female vocal', duo: 'male and female duet' };

module.exports = { STYLES, VOICES };

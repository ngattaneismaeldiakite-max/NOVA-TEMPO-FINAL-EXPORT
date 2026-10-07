// Fabrique promo/video.html : insère le CSS réel de studio.html (media queries "mobile" dépliées) dans le modèle.
const fs = require('fs'), path = require('path');
const racine = process.argv[2], tpl = process.argv[3];
const studio = fs.readFileSync(path.join(racine, 'studio.html'), 'utf8').replace(/\r\n/g, '\n');
let css = studio.slice(studio.indexOf('<style>') + 7, studio.indexOf('</style>'));
// Dépliage des @media : max-width >= 430 -> règles appliquées (le "téléphone" fait 430 px) ; sinon supprimées
let sortie = '', i = 0;
while (i < css.length) {
    const m = /@media\s*\(\s*(max|min)-width:\s*(\d+)px\s*\)\s*\{/.exec(css.slice(i));
    if (!m) { sortie += css.slice(i); break; }
    sortie += css.slice(i, i + m.index);
    let debut = i + m.index + m[0].length, prof = 1, j = debut;
    while (j < css.length && prof > 0) { if (css[j] === '{') prof++; else if (css[j] === '}') prof--; j++; }
    const contenu = css.slice(debut, j - 1);
    if (m[1] === 'max' && parseInt(m[2], 10) >= 430) sortie += `\n/* @media max-width ${m[2]} déplié */\n` + contenu + '\n';
    i = j;
}
// Retire ce qui concerne la page réelle (fond, barre de navigation, conteneur) et les cartes modales plein écran
sortie = sortie.replace(/\bbody\s*\{[^}]*\}/g, '').replace(/\.bg-image\s*\{[^}]*\}/g, '').replace(/(^|\n)\s*nav\s*\{[^}]*\}/g, '\n');
const html = fs.readFileSync(tpl, 'utf8').replace('/*REAL_CSS*/', () => sortie);
fs.mkdirSync(path.join(racine, 'promo'), { recursive: true });
fs.writeFileSync(path.join(racine, 'promo', 'video.html'), html);
console.log('promo/video.html écrit,', (html.length / 1024).toFixed(0), 'Ko');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    
    try {
        const { prompt, genre } = req.body || {};
        if (!prompt || !genre) return res.status(400).json({ error: "Infos manquantes." });
        
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Clé API manquante." });
        
        const systemPrompt = `Tu es un auteur-compositeur primé, expert en création de hits (Afrobeat, Rap, Pop). 
Ton objectif : écrire des paroles SPÉCIALEMENT formatées pour le moteur musical Suno AI.

Le secret d'une bonne chanson, c'est la MUSICALITÉ. Tu dois ABSOLUMENT respecter ces 5 règles d'or :

1. BALISES MUSICALES (ESSENTIEL) : Tu dois guider l'instrumentale de Suno en utilisant des balises entre crochets. 
Utilise obligatoirement cette structure : 
[Intro musicale]
[Couplet 1]
[Pré-Refrain]
[Refrain] (Le refrain doit être très accrocheur)
[Couplet 2]
[Refrain]
[Outro]

2. RYTHME ET RIMES : Fais des phrases COURTES (6 à 10 mots maximum par ligne). La fin des lignes DOIT rimer (AABB ou ABAB). Si tes phrases sont trop longues, le chanteur IA va s'essouffler et rater la chanson.

3. AD-LIBS ET VIE : Ajoute des petites voix d'ambiance entre parenthèses à la fin de certaines lignes pour donner de la vie (ex: (Yeah!), (Let's go!), (Ouh-ouh!), (Eh eh)).

4. PERSONNALISATION EXTRÊME : Inclus obligatoirement le(s) prénom(s) et les détails (âge, anecdote) donnés par l'utilisateur.

5. TON NATUREL ET MODERNE : Zéro poésie clichée (pas de destin, d'âme, d'étoiles). Utilise le langage d'aujourd'hui, percutant et festif.

Ne réponds QUE par les paroles. Aucun texte d'introduction ou de conclusion.`;
        
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-120b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Style : ${genre}\n\nHistoire : ${prompt}` }
                ]
            })
        });

        const data = await groqRes.json().catch(() => ({}));
        if (!groqRes.ok || data.error) throw new Error((data.error && data.error.message) ? data.error.message : `Erreur HTTP ${groqRes.status}`);
        if (!data.choices || !data.choices[0] || !data.choices[0].message) throw new Error("Format inattendu de Groq.");
        
        return res.status(200).json({ lyrics: data.choices[0].message.content.trim() });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
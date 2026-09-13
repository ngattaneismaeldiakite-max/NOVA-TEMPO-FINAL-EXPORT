export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });
    const { prompt, genre } = req.body;
    
    // Pour l'instant, on renvoie directement le prompt comme paroles pour tester l'audio rapidement
    const mockLyrics = (Couplet 1)\n + prompt + \n\n(Refrain)\nOn s'enjaille sur du  + genre + !\n\n(Couplet 2)\nC'est NovaTempo dans la place !;
    
    return res.status(200).json({ lyrics: mockLyrics });
}
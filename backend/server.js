const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Biblioteca para fazer requisições HTTP
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Permite que seu front-end no GitHub Pages acesse este servidor

// Simulação de CACHE em memória (na prática, use um banco de dados)
let cachedOdds = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos

// SUA CHAVE da API de terceiros (NUNCA a coloque no front-end!)
const THIRD_PARTY_API_KEY = 'SUA_CHAVE_AQUI';
const THIRD_PARTY_API_URL = 'https://api.sportmonks.com/v3/football/odds/pre-match'; // Exemplo

app.get('/api/suggestions', async (req, res) => {
    const { bankroll, profile } = req.query;

    try {
        // 1. Buscar odds (com cache de 1 hora)
        const oddsData = await getCachedOdds();

        // 2. Filtrar e processar os dados conforme perfil (lógica simplificada)
        const suggestions = oddsData.slice(0, 3).map(odd => ({ // Pega 3 primeiros jogos
            event: `${odd.home_team} vs ${odd.away_team}`,
            odd: odd.value,
            suggestedBet: calculateBet(bankroll, profile, odd.value),
            estimatedWin: bankroll * odd.value
        }));

        res.json(suggestions);
    } catch (error) {
        console.error("Erro no back-end:", error);
        res.status(500).json({ error: 'Falha ao processar sugestões' });
    }
});

async function getCachedOdds() {
    const now = Date.now();
    // Se o cache é válido, retorna os dados em cache
    if (cachedOdds && (now - lastFetchTime) < CACHE_DURATION) {
        console.log('Retornando dados do cache.');
        return cachedOdds;
    }
    // Se não, busca da API externa
    console.log('Buscando dados da API externa...');
    const response = await axios.get(THIRD_PARTY_API_URL, {
        params: { api_token: THIRD_PARTY_API_KEY }
    });
    cachedOdds = response.data.data; // Formato da Sportmonks[citation:1]
    lastFetchTime = now;
    return cachedOdds;
}

function calculateBet(bankroll, profile, odd) {
    const profiles = { low: 0.05, medium: 0.10, high: 0.20 }; // % do bankroll
    return bankroll * (profiles[profile] || 0.05);
}

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

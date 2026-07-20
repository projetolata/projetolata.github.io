// ================= CONFIGURAÇÕES DO JSONBIN =================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe"; // <--- COLE SUA MASTER KEY AQUI ENTRE AS ASPAS
// ==========================================================

dadosSalvos = { 
    pins: [], 
    textos: [], 
    tracos: [] 
};

// 1. CARREGAR OS DADOS (Executa assim que o site abre)
async function carregarDados() {
    try {
        const response = await fetch(JSONBIN_URL, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        
        if (response.ok) {
            const resData = await response.json();
            
            // O JSONBin guarda os dados reais dentro de .record
            dadosSalvos = resData.record || {};
            
            // Garante que as listas existem para evitar erros
            if (!dadosSalvos.pins) dadosSalvos.pins = [];
            if (!dadosSalvos.textos) dadosSalvos.textos = [];
            if (!dadosSalvos.tracos) dadosSalvos.tracos = [];

            // Desenha todos os itens salvos na tela
            dadosSalvos.pins.forEach(p => desenharPinVisual(p));
            dadosSalvos.textos.forEach(t => desenharTextoVisual(t));
            dadosSalvos.tracos.forEach(tr => desenharTracoVisual(tr));
            
            console.log("Dados carregados com sucesso!");
        } else {
            console.error("Erro ao carregar do JSONBin. Status:", response.status);
        }
    } catch (e) {
        console.error("Erro de conexão ao carregar dados:", e);
    }
}

// 2. SALVAR OS DADOS NA NUVEM (Envia a lista completa atualizada)
async function salvarNoGithub() { // Nome mantido para não quebrar o resto do seu projeto
    try {
        const response = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_KEY
            },
            body: JSON.stringify(dadosSalvos)
        });

        if (response.ok) {
            console.log("Alterações salvas com sucesso no JSONBin!");
        } else {
            console.error("Erro ao salvar. Status:", response.status);
        }
    } catch (e) {
        console.error("Erro de conexão ao salvar:", e);
    }
}

// 3. EXEMPLO DE COMO ADICIONAR UM NOVO PIN (Certifique-se de usar .push)
function adicionarPinNoMapa(latitude, longitude, nomePin) {
    const novoPin = {
        lat: latitude,
        lng: longitude,
        nome: nomePin
    };

    // ADICIONA na lista existente (NÃO substitui o array todo)
    dadosSalvos.pins.push(novoPin);

    // Mostra visualmente na tela
    desenharPinVisual(novoPin);

    // Salva tudo na nuvem
    salvarNoGithub();
}

// Funções visuais de exemplo (substitua pelas funções de desenho do seu mapa/Leaflet)
function desenharPinVisual(pin) {
    // Exemplo: Lógica que coloca o marcador visualmente no mapa usando pin.lat, pin.lng, pin.nome
}

function desenharTextoVisual(texto) {
    // Lógica para desenhar textos
}

function desenharTracoVisual(traco) {
    // Lógica para desenhar traços
}

// Executa o carregamento assim que o script é lido na página
carregarDados();

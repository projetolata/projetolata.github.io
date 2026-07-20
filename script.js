// ================= CONFIGURAÇÕES DO JSONBIN =================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe"; // <--- COLE SUA MASTER KEY AQUI
// ==========================================================

let dadosSalvos = { 
    pins: [], 
    textos: [], 
    tracos: [] 
};

// 1. INICIALIZAR O MAPA (Ajuste 'map' para o ID da sua div no HTML se for diferente)
const map = L.map('map').setView([0, 0], 2); // Coloque as coordenadas centrais e o zoom inicial do seu mapa

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// 2. FUNÇÃO VISUAL PARA DESENHAR O PIN NO MAPA
function desenharPinVisual(pin) {
    // Cria o marcador no mapa usando Leaflet
    const marker = L.marker([pin.lat, pin.lng]).addTo(map);
    if (pin.nome) {
        marker.bindPopup(pin.nome);
    }
}

function desenharTextoVisual(texto) {
    // Sua lógica de texto (se houver)
}

function desenharTracoVisual(traco) {
    // Sua lógica de traços (se houver)
}

// 3. CARREGAR OS DADOS DA NUVEM
async function carregarDados() {
    try {
        const response = await fetch(JSONBIN_URL, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        
        if (response.ok) {
            const resData = await response.json();
            dadosSalvos = resData.record || {};
            
            if (!dadosSalvos.pins) dadosSalvos.pins = [];
            if (!dadosSalvos.textos) dadosSalvos.textos = [];
            if (!dadosSalvos.tracos) dadosSalvos.tracos = [];

            // Desenha todos os pins salvos na tela
            dadosSalvos.pins.forEach(p => desenharPinVisual(p));
            dadosSalvos.textos.forEach(t => desenharTextoVisual(t));
            dadosSalvos.tracos.forEach(tr => desenharTracoVisual(tr));
            
            console.log("Mapa e pins carregados com sucesso!");
        }
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

// 4. SALVAR OS DADOS NA NUVEM
async function salvarNoGithub() { // Nome mantido para não quebrar seus botões
    try {
        await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_KEY
            },
            body: JSON.stringify(dadosSalvos)
        });
        console.log("Salvo com sucesso!");
    } catch (e) {
        console.error("Erro ao salvar:", e);
    }
}

// 5. CLIQUE NO MAPA PARA ADICIONAR UM NOVO PIN
map.on('click', function(e) {
    const nomePin = prompt("Nome do pin:");
    if (!nomePin) return;

    const novoPin = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        nome: nomePin
    };

    // Adiciona na lista e desenha na hora
    dadosSalvos.pins.push(novoPin);
    desenharPinVisual(novoPin);

    // Salva no JSONBin
    salvarNoGithub();
});

// Executa ao abrir a página
carregarDados();

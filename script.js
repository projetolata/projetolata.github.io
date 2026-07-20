// ================= CONFIGURAÇÕES DO JSONBIN =================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe"; // <--- COLE SUA MASTER KEY AQUI
// ==========================================================

let dadosSalvos = { 
    pins: [], 
    textos: [], 
    tracos: [] 
};

// 1. INICIALIZAÇÃO DO SEU MAPA (Com a sua imagem personalizada e CRS.Simple)
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 4
});

// Defina aqui as dimensões da sua imagem do mapa (largura, altura)
const larguraImagem = 2048; 
const alturaImagem = 2048;
const bounds = [[0, 0], [alturaImagem, larguraImagem]];

L.imageOverlay('mapa.jpg', bounds).addTo(map); // Mude 'mapa.jpg' para o nome exato do arquivo da sua imagem
map.fitBounds(bounds);

// 2. FUNÇÕES VISUAIS PARA DESENHAR OS ITENS NO SEU MAPA
function desenharPinVisual(pin) {
    const marker = L.marker([pin.lat, pin.lng]).addTo(map);
    if (pin.nome) {
        marker.bindPopup(pin.nome);
    }
}

function desenharTextoVisual(texto) {
    // Sua lógica existente para desenhar textos
}

function desenharTracoVisual(traco) {
    // Sua lógica existente para desenhar traços
}

// 3. CARREGAR OS DADOS DA NUVEM (Ao abrir o site)
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

            // Desenha todos os itens salvos no seu mapa
            dadosSalvos.pins.forEach(p => desenharPinVisual(p));
            dadosSalvos.textos.forEach(t => desenharTextoVisual(t));
            dadosSalvos.tracos.forEach(tr => desenharTracoVisual(tr));
            
            console.log("Dados carregados com sucesso no seu mapa!");
        } else {
            console.error("Erro ao carregar do JSONBin. Status:", response.status);
        }
    } catch (e) {
        console.error("Erro de conexão ao carregar dados:", e);
    }
}

// 4. SALVAR OS DADOS NA NUVEM
async function salvarNoGithub() { // Nome mantido para não quebrar outros botões do seu projeto
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
            console.log("Salvo com sucesso no JSONBin!");
        } else {
            console.error("Erro ao salvar. Status:", response.status);
        }
    } catch (e) {
        console.error("Erro de conexão ao salvar:", e);
    }
}

// 5. CLIQUE NO SEU MAPA PARA ADICIONAR UM NOVO PIN
map.on('click', function(e) {
    const nomePin = prompt("Nome do pin:");
    if (!nomePin) return;

    const novoPin = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        nome: nomePin
    };

    // Adiciona na lista, desenha na tela e salva na nuvem
    dadosSalvos.pins.push(novoPin);
    desenharPinVisual(novoPin);
    salvarNoGithub();
});

// Executa o carregamento assim que o script é aberto
carregarDados();// ================= CONFIGURAÇÕES DO JSONBIN =================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe"; // <--- COLE SUA MASTER KEY AQUI
// ==========================================================

// DECLARAÇÃO CORRETA DA VARIÁVEL GLOBAL
let dadosSalvos = { 
    pins: [], 
    textos: [], 
    tracos: [] 
};

// 1. INICIALIZAR O MAPA (Ajuste 'map' se o ID da sua div for diferente no HTML)
const map = L.map('map').setView([0, 0], 2); 

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

// 2. FUNÇÃO VISUAL PARA DESENHAR O PIN NO MAPA
function desenharPinVisual(pin) {
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
async function salvarNoGithub() { // Nome mantido para não quebrar outros botões
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

    dadosSalvos.pins.push(novoPin);
    desenharPinVisual(novoPin);
    salvarNoGithub();
});

// Executa ao abrir a página
carregarDados();

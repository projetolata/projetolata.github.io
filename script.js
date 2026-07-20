// ================= CONFIGURAÇÕES DO JSONBIN =================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "COLE_SUA_MASTER_KEY_AQUI"; // <--- COLE SUA MASTER KEY AQUI
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
carregarDados();// ====================== CONFIGURAÇÕES ======================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe";

let dadosSalvos = { pins: [], texts: [], emojis: [], polylines: [], polygons: [] };
let map, drawnItems;
let isPanelVisible = true;

// ====================== INICIALIZAÇÃO ======================
function initMap() {
    map = L.map('map', { crs: L.CRS.Simple, minZoom: -3, maxZoom: 5 });

    const bounds = [[0, 0], [2048, 2048]];
    L.imageOverlay('mapa0001a.png', bounds).addTo(map);
    map.fitBounds(bounds);

    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
        draw: {
            marker: true,
            polyline: { shapeOptions: { color: '#0066cc', weight: 5 } },
            polygon: { shapeOptions: { color: '#0066cc', weight: 5 } },
            rectangle: { shapeOptions: { color: '#0066cc', weight: 5 } },
            circle: false,
            circlemarker: false
        },
        edit: { featureGroup: drawnItems, remove: true }
    });
   **✅ Entendido! Versão Atualizada conforme seu pedido exato:**

### Principais Melhorias:
- Removido completamente qualquer pedido de latitude/longitude
- Menu pequeno, **movimentável (arrastável)** e **fechável**
- Melhoria na exclusão: agora você pode clicar com botão direito em qualquer pin/desennho para deletar individualmente

---

### **1. `index.html`**

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapa Interativo - Atlas</title>
    
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
    <link rel="stylesheet" href="style.css" />
    
    <style>
        body { margin: 0; padding: 0; overflow: hidden; }
        #map { height: 100vh; width: 100vw; }

        .info-panel {
            position: absolute;
            top: 15px;
            left: 15px;
            background: rgba(255, 255, 255, 0.98);
            padding: 12px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            z-index: 1000;
            width: 220px;
            cursor: move;
            user-select: none;
        }
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            font-weight: bold;
        }
        button {
            width: 100%;
            margin: 6px 0;
            padding: 9px;
            border: none;
            border-radius: 6px;
            background: #0066cc;
            color: white;
            cursor: pointer;
        }
        button:hover { background: #0052a3; }
        .delete-btn { background: #d32f2f; }
        .delete-btn:hover { background: #b71c1c; }
        .close-btn {
            background: transparent;
            color: #333;
            width: auto;
            padding: 0 6px;
        }
    </style>
</head>
<body>
    <div id="map"></div>

    <!-- Menu Movimentável -->
    <div id="info-panel" class="info-panel">
        <div class="panel-header">
            <span>🗺️ Atlas</span>
            <button class="close-btn" onclick="togglePanel()">✕</button>
        </div>
        <button onclick="adicionarTexto()">✍️ Adicionar Texto</button>
        <button onclick="adicionarEmoji()">😀 Adicionar Emoji</button>
        <button onclick="limparTudo()" class="delete-btn">🗑️ Limpar Tudo</button>
        <button onclick="exportarDados()">📤 Exportar</button>
        <button onclick="importarDados()">📥 Importar</button>
    </div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    <script src="script.js"></script>
</body>
</html>

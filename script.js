// ====================== CONFIGURAÇÕES ======================
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

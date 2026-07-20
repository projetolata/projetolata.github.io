// ====================== CONFIGURAÇÕES ======================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe"; // ← Troque pela sua key

// ====================== VARIÁVEIS GLOBAIS ======================
let dadosSalvos = {
    pins: [],
    polylines: [],
    polygons: []
};

let map;
let drawnItems;

// ====================== INICIALIZAÇÃO ======================
function initMap() {
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -3,
        maxZoom: 5,
        zoomControl: true,
        attributionControl: false
    });

    // === IMAGEM DO MAPA PERSONALIZADA ===
    const largura = 2048;
    const altura = 2048;
    const bounds = [[0, 0], [altura, largura]];
    
    L.imageOverlay('mapa.jpg', bounds).addTo(map); // Altere o nome se necessário
    map.fitBounds(bounds);

    // Camada para os desenhos
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // ================= CONTROLES DE DESENHO =================
    const drawControl = new L.Control.Draw({
        draw: {
            marker: true,
            polyline: { shapeOptions: { color: '#3388ff' } },
            polygon: { shapeOptions: { color: '#3388ff' } },
            rectangle: { shapeOptions: { color: '#3388ff' } },
            circle: false,
            circlemarker: false
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });
    map.addControl(drawControl);

    // ================= EVENTOS ======================
    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on('click', handleSimpleClick);

    carregarDados();
}

// ====================== EVENTOS DE DESENHO ======================
function handleDrawCreated(e) {
    const layer = e.layer;
    drawnItems.addLayer(layer);

    if (e.layerType === 'marker') {
        const nome = prompt("Nome do marcador:", "Novo Pin") || "Sem nome";
        layer.bindPopup(nome);

        dadosSalvos.pins.push({
            lat: layer.getLatLng().lat,
            lng: layer.getLatLng().lng,
            nome: nome
        });
    } 
    else if (e.layerType === 'polyline') {
        dadosSalvos.polylines.push({
            coords: layer.getLatLngs(),
            color: '#3388ff'
        });
    } 
    else if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
        dadosSalvos.polygons.push({
            coords: layer.getLatLngs(),
            color: '#3388ff'
        });
    }

    salvarDados();
}

// Clique simples no mapa
function handleSimpleClick(e) {
    if (!confirm("Adicionar um pin neste local?")) return;

    const nome = prompt("Nome do pin:", "") || "Novo Pin";
    const marker = L.marker(e.latlng).addTo(drawnItems);
    marker.bindPopup(nome);

    dadosSalvos.pins.push({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        nome: nome
    });

    salvarDados();
}

// ====================== SALVAR / CARREGAR ======================
async function carregarDados() {
    try {
        const response = await fetch(JSONBIN_URL, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });

        if (response.ok) {
            const json = await response.json();
            dadosSalvos = json.record || dadosSalvos;

            restaurarElementos();
            console.log("✅ Dados carregados com sucesso!");
        }
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
    }
}

async function salvarDados() {
    try {
        await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_KEY
            },
            body: JSON.stringify(dadosSalvos)
        });
        console.log("💾 Dados salvos no JSONBin");
    } catch (err) {
        console.error("Erro ao salvar:", err);
    }
}

function restaurarElementos() {
    drawnItems.clearLayers();

    // Pins
    dadosSalvos.pins.forEach(pin => {
        const marker = L.marker([pin.lat, pin.lng]).addTo(drawnItems);
        if (pin.nome) marker.bindPopup(pin.nome);
    });

    // Polylines
    dadosSalvos.polylines.forEach(line => {
        L.polyline(line.coords, { color: line.color }).addTo(drawnItems);
    });

    // Polygons
    dadosSalvos.polygons.forEach(poly => {
        L.polygon(poly.coords, { color: poly.color }).addTo(drawnItems);
    });
}

// ====================== FUNÇÕES AUXILIARES ======================
function adicionarPinManual() {
    const lat = parseFloat(prompt("Latitude:"));
    const lng = parseFloat(prompt("Longitude:"));
    const nome = prompt("Nome do pin:") || "Novo Pin";

    if (isNaN(lat) || isNaN(lng)) return;

    const marker = L.marker([lat, lng]).addTo(drawnItems);
    marker.bindPopup(nome);

    dadosSalvos.pins.push({ lat, lng, nome });
    salvarDados();
}

async function limparTudo() {
    if (!confirm("⚠️ Apagar TODOS os itens do mapa?")) return;
    
    drawnItems.clearLayers();
    dadosSalvos = { pins: [], polylines: [], polygons: [] };
    await salvarDados();
    alert("Mapa limpo!");
}

function exportarDados() {
    const dataStr = JSON.stringify(dadosSalvos, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mapa_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ====================== INICIAR ======================
document.addEventListener('DOMContentLoaded', initMap);

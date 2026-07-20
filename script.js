// ====================== CONFIGURAÇÕES ======================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe"; // ← Troque pela sua Master Key

// ====================== DADOS ======================
let dadosSalvos = {
    pins: [],
    polylines: [],
    polygons: []
};

let map;
let drawnItems;

// ====================== INICIAR MAPA ======================
function initMap() {
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -3,
        maxZoom: 5
    });

    const bounds = [[0, 0], [2048, 2048]];
    L.imageOverlay('mapa0001a.png', bounds).addTo(map);
    map.fitBounds(bounds);

    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Controles de desenho
    const drawControl = new L.Control.Draw({
        draw: {
            marker: true,
            polyline: { shapeOptions: { color: '#0066cc', weight: 5 }},
            polygon: { shapeOptions: { color: '#0066cc', weight: 5 }},
            rectangle: { shapeOptions: { color: '#0066cc', weight: 5 }},
            circle: false,
            circlemarker: false
        },
        edit: { featureGroup: drawnItems, remove: true }
    });
    map.addControl(drawControl);

    // Eventos
    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on('click', handleMapClick);

    carregarDados();
}

// ====================== EVENTOS ======================
function handleDrawCreated(e) {
    const layer = e.layer;
    drawnItems.addLayer(layer);

    if (e.layerType === 'marker') {
        const nome = prompt("Nome do marcador:", "Novo Pin") || "Sem nome";
        layer.bindPopup(`<b>${nome}</b>`);
        dadosSalvos.pins.push({ lat: layer.getLatLng().lat, lng: layer.getLatLng().lng, nome });
    } else if (e.layerType === 'polyline') {
        dadosSalvos.polylines.push({ coords: layer.getLatLngs(), color: '#0066cc' });
    } else if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
        dadosSalvos.polygons.push({ coords: layer.getLatLngs(), color: '#0066cc' });
    }

    salvarDados();
}

function handleMapClick(e) {
    if (!confirm("Adicionar pin neste local?")) return;
    const nome = prompt("Nome do pin:", "") || "Novo Pin";
    const marker = L.marker(e.latlng).addTo(drawnItems);
    marker.bindPopup(`<b>${nome}</b>`);

    dadosSalvos.pins.push({ lat: e.latlng.lat, lng: e.latlng.lng, nome });
    salvarDados();
}

// ====================== SALVAR / CARREGAR ======================
async function carregarDados() {
    try {
        const res = await fetch(JSONBIN_URL, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        if (res.ok) {
            const json = await res.json();
            dadosSalvos = json.record || dadosSalvos;
            restaurarElementos();
        }
    } catch (err) {
        console.error("Erro ao carregar:", err);
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
    } catch (err) {
        console.error("Erro ao salvar:", err);
    }
}

function restaurarElementos() {
    drawnItems.clearLayers();

    dadosSalvos.pins.forEach(p => {
        const m = L.marker([p.lat, p.lng]).addTo(drawnItems);
        m.bindPopup(`<b>${p.nome}</b>`);
    });

    dadosSalvos.polylines.forEach(l => L.polyline(l.coords, { color: l.color }).addTo(drawnItems));
    dadosSalvos.polygons.forEach(p => L.polygon(p.coords, { color: p.color }).addTo(drawnItems));
}

// ====================== FUNÇÕES GLOBAIS ======================
window.adicionarPinManual = () => {
    const lat = parseFloat(prompt("Latitude:"));
    const lng = parseFloat(prompt("Longitude:"));
    const nome = prompt("Nome:", "Novo Pin") || "Sem nome";

    if (isNaN(lat) || isNaN(lng)) return;

    const marker = L.marker([lat, lng]).addTo(drawnItems);
    marker.bindPopup(`<b>${nome}</b>`);

    dadosSalvos.pins.push({ lat, lng, nome });
    salvarDados();
};

window.limparTudo = async () => {
    if (!confirm("Apagar TODOS os itens?")) return;
    drawnItems.clearLayers();
    dadosSalvos = { pins: [], polylines: [], polygons: [] };
    await salvarDados();
};

window.exportarDados = () => {
    const dataStr = JSON.stringify(dadosSalvos, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
};

window.importarDados = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async ev => {
            try {
                dadosSalvos = JSON.parse(ev.target.result);
                restaurarElementos();
                await salvarDados();
                alert("✅ Importado com sucesso!");
            } catch (err) {
                alert("Erro ao importar arquivo.");
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// Iniciar
document.addEventListener('DOMContentLoaded', initMap);

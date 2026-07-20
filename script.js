// ====================== CONFIGURAÇÕES ======================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe"; // Troque pela sua Master Key

let dadosSalvos = { pins: [], polylines: [], polygons: [] };
let map;
let drawnItems;

// ====================== INICIALIZAÇÃO ======================
function initMap() {
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -3,
        maxZoom: 5
    });

    // Imagem do mapa
    const bounds = [[0, 0], [2048, 2048]];
    L.imageOverlay('mapa0001a.png', bounds).addTo(map);
    map.fitBounds(bounds);

    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Controles de Desenho
    const drawControl = new L.Control.Draw({
        draw: {
            marker: true,
            polyline: { shapeOptions: { color: '#0066cc', weight: 5 } },
            polygon: { shapeOptions: { color: '#0066cc', weight: 5 } },
            rectangle: { shapeOptions: { color: '#0066cc', weight: 5 } },
            circle: false,
            circlemarker: false
        },
        edit: {
            featureGroup: drawnItems,
            remove: true
        }
    });
    map.addControl(drawControl);

    // Eventos
    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on('click', handleMapClick);

    carregarDados();
}

// ====================== EVENTOS ======================
function handleDrawCreated(e) {
    drawnItems.addLayer(e.layer);

    if (e.layerType === 'marker') {
        const nome = prompt("Nome do marcador:", "Novo Pin") || "Sem nome";
        e.layer.bindPopup(`<b>${nome}</b>`);
        dadosSalvos.pins.push({
            lat: e.layer.getLatLng().lat,
            lng: e.layer.getLatLng().lng,
            nome: nome
        });
    } else if (e.layerType === 'polyline') {
        dadosSalvos.polylines.push({ coords: e.layer.getLatLngs(), color: '#0066cc' });
    } else if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
        dadosSalvos.polygons.push({ coords: e.layer.getLatLngs(), color: '#0066cc' });
    }

    salvarDados();
}

function handleMapClick(e) {
    if (!confirm("Adicionar pin aqui?")) return;
    const nome = prompt("Nome do pin:", "") || "Novo Pin";
    const marker = L.marker(e.latlng).addTo(drawnItems);
    marker.bindPopup(`<b>${nome}</b>`);

    dadosSalvos.pins.push({ lat: e.latlng.lat, lng: e.latlng.lng, nome });
    salvarDados();
}

// ====================== CARREGAR / SALVAR ======================
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
        const marker = L.marker([p.lat, p.lng]).addTo(drawnItems);
        marker.bindPopup(`<b>${p.nome}</b>`);
    });

    dadosSalvos.polylines.forEach(l => L.polyline(l.coords, { color: l.color }).addTo(drawnItems));
    dadosSalvos.polygons.forEach(p => L.polygon(p.coords, { color: p.color }).addTo(drawnItems));
}

// ====================== FUNÇÕES DO MENU ======================
window.adicionarPinManual = function () {
    const lat = parseFloat(prompt("Latitude:"));
    const lng = parseFloat(prompt("Longitude:"));
    if (isNaN(lat) || isNaN(lng)) return alert("Coordenadas inválidas!");

    const nome = prompt("Nome do pin:", "Novo Pin") || "Sem nome";
    const marker = L.marker([lat, lng]).addTo(drawnItems);
    marker.bindPopup(`<b>${nome}</b>`);

    dadosSalvos.pins.push({ lat, lng, nome });
    salvarDados();
};

window.limparTudo = async function () {
    if (!confirm("Apagar TODO o mapa?")) return;
    drawnItems.clearLayers();
    dadosSalvos = { pins: [], polylines: [], polygons: [] };
    await salvarDados();
};

window.exportarDados = function () {
    const dataStr = JSON.stringify(dadosSalvos, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atlas_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
};

window.importarDados = function () {
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
                alert("Importado com sucesso!");
            } catch (err) {
                alert("Erro ao importar arquivo.");
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

// ====================== INICIAR ======================
window.onload = initMap;

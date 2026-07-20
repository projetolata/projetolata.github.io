// ====================== CONFIGURAÇÕES ======================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe";

let dadosSalvos = { pins: [], texts: [], emojis: [], polylines: [], polygons: [] };
let map;
let drawnItems;

// ====================== INICIALIZAÇÃO ======================
function initMap() {
    map = L.map('map', { crs: L.CRS.Simple, minZoom: -3, maxZoom: 5 });

    const bounds = [[0, 0], [2048, 2048]];
    L.imageOverlay('mapa.jpg', bounds).addTo(map);
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
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, handleDrawCreated);
    map.on('click', handleMapClick);

    carregarDados();
}

// ====================== EVENTOS ======================
function handleDrawCreated(e) {
    drawnItems.addLayer(e.layer);

    if (e.layerType === 'marker') {
        const nome = prompt("Nome do pin:", "Novo Pin") || "Pin";
        e.layer.bindPopup(`<b>${nome}</b>`);
        dadosSalvos.pins.push({ lat: e.layer.getLatLng().lat, lng: e.layer.getLatLng().lng, nome });
    } else if (e.layerType === 'polyline') {
        dadosSalvos.polylines.push({ coords: e.layer.getLatLngs(), color: '#0066cc' });
    } else if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
        dadosSalvos.polygons.push({ coords: e.layer.getLatLngs(), color: '#0066cc' });
    }
    salvarDados();
}

function handleMapClick(e) {
    // Clique simples agora só avisa (pode desenhar com as ferramentas)
    console.log("Clique em uma ferramenta de desenho para adicionar");
}

// ====================== NOVAS FERRAMENTAS ======================
window.adicionarTexto = function() {
    const texto = prompt("Digite o texto:");
    if (!texto) return;

    const latlng = map.getCenter();
    const marker = L.marker(latlng, {
        icon: L.divIcon({
            className: 'text-label',
            html: `<div style="font-size:18px; font-weight:bold; color:#000; text-shadow: 0 0 4px white;">${texto}</div>`,
            iconSize: [150, 40]
        })
    }).addTo(drawnItems);

    dadosSalvos.texts.push({ lat: latlng.lat, lng: latlng.lng, texto: texto });
    salvarDados();
};

window.adicionarEmoji = function() {
    const emoji = prompt("Digite o emoji (ex: 🔥, 🏰, 📍):", "📍");
    if (!emoji) return;

    const latlng = map.getCenter();
    const marker = L.marker(latlng, {
        icon: L.divIcon({
            className: 'emoji-label',
            html: `<div style="font-size:42px;">${emoji}</div>`,
            iconSize: [50, 50]
        })
    }).addTo(drawnItems);

    dadosSalvos.emojis.push({ lat: latlng.lat, lng: latlng.lng, emoji: emoji });
    salvarDados();
};

// ====================== PERSISTÊNCIA ======================
async function carregarDados() {
    try {
        const res = await fetch(JSONBIN_URL, { headers: { 'X-Master-Key': JSONBIN_KEY } });
        if (res.ok) {
            const json = await res.json();
            dadosSalvos = json.record || dadosSalvos;
            restaurarElementos();
        }
    } catch (err) { console.error(err); }
}

async function salvarDados() {
    try {
        await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
            body: JSON.stringify(dadosSalvos)
        });
    } catch (err) { console.error(err); }
}

function restaurarElementos() {
    drawnItems.clearLayers();

    // Pins
    dadosSalvos.pins.forEach(p => {
        const m = L.marker([p.lat, p.lng]).addTo(drawnItems);
        m.bindPopup(`<b>${p.nome}</b>`);
    });

    // Textos
    dadosSalvos.texts.forEach(t => {
        L.marker([t.lat, t.lng], {
            icon: L.divIcon({ html: `<div style="font-size:18px; font-weight:bold;">${t.texto}</div>`, iconSize: [150,40] })
        }).addTo(drawnItems);
    });

    // Emojis
    dadosSalvos.emojis.forEach(e => {
        L.marker([e.lat, e.lng], {
            icon: L.divIcon({ html: `<div style="font-size:42px;">${e.emoji}</div>`, iconSize: [50,50] })
        }).addTo(drawnItems);
    });

    // Desenhos
    dadosSalvos.polylines.forEach(l => L.polyline(l.coords, { color: l.color }).addTo(drawnItems));
    dadosSalvos.polygons.forEach(p => L.polygon(p.coords, { color: p.color }).addTo(drawnItems));
}

// ====================== OUTRAS FUNÇÕES ======================
window.limparTudo = async function () {
    if (!confirm("Limpar todo o mapa?")) return;
    drawnItems.clearLayers();
    dadosSalvos = { pins: [], texts: [], emojis: [], polylines: [], polygons: [] };
    await salvarDados();
};

window.exportarDados = function () {
    const blob = new Blob([JSON.stringify(dadosSalvos, null, 2)], { type: "application/json" });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `atlas_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
};

window.importarDados = function () {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const reader = new FileReader();
        reader.onload = async ev => {
            try {
                dadosSalvos = JSON.parse(ev.target.result);
                restaurarElementos();
                await salvarDados();
                alert("Importado!");
            } catch (err) { alert("Erro ao importar"); }
        };
        reader.readAsText(e.target.files[0]);
    };
    input.click();
};

// Iniciar
window.onload = initMap;

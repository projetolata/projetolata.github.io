// ====================== CONFIGURAÇÕES ======================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe";

let dadosSalvos = { pins: [], texts: [], emojis: [], polylines: [], polygons: [] };
let map, drawnItems;

// ====================== INICIALIZAÇÃO ======================
function initMap() {
    map = L.map('map', { crs: L.CRS.Simple, minZoom: -3, maxZoom: 5 });

    const larguraImagem = 2048; 
    const alturaImagem = 2048;
    const bounds = [[0, 0], [alturaImagem, larguraImagem]];

    const imageOverlay = L.imageOverlay('mapa0001a.png', bounds).addTo(map);
    
    imageOverlay.on('load', function() {
        map.fitBounds(bounds);
    });
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

    // Evento ao criar um novo elemento com o Leaflet Draw
    map.on(L.Draw.Event.CREATED, function (e) {
        const layer = e.layer;
        const type = e.layerType;

        adicionarLayerAoBanco(layer, type);
        drawnItems.addLayer(layer);
        salvarNoJsonBin();
    });

    // Evento ao deletar elementos usando a ferramenta de edição do Leaflet
    map.on('draw:deleted', function (e) {
        e.layers.eachLayer(function (layer) {
            removerLayerDoBanco(layer);
        });
        salvarNoJsonBin();
    });

    carregarDoJsonBin();
}

// ====================== GERENCIAMENTO DE DADOS ======================

async function carregarDoJsonBin() {
    try {
        const response = await fetch(JSONBIN_URL, {
            headers: { 'X-Master-Key': JSONBIN_KEY }
        });
        
        if (response.ok) {
            const resData = await response.json();
            dadosSalvos = resData.record || { pins: [], texts: [], emojis: [], polylines: [], polygons: [] };
            
            drawnItems.clearLayers();
            redesenharTudoNaTela();
            console.log("Dados carregados com sucesso!");
        }
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }
}

async function salvarNoJsonBin() {
    try {
        await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_KEY
            },
            body: JSON.stringify(dadosSalvos)
        });
        console.log("Salvo na nuvem com sucesso!");
    } catch (e) {
        console.error("Erro ao salvar dados:", e);
    }
}

// ====================== ADICIONAR E REMOVER ITENS ======================

function adicionarLayerAoBanco(layer, type) {
    if (type === 'marker') {
        const latlng = layer.getLatLng();
        const nome = prompt("Nome do pin:") || "Marcador";
        const pinData = { lat: latlng.lat, lng: latlng.lng, nome: nome };
        dadosSalvos.pins.push(pinData);
        
        adicionarPopupDeletar(layer, pinData, 'pins');
    } 
    else if (type === 'polyline') {
        const latlngs = layer.getLatLngs();
        dadosSalvos.polylines.push(latlngs);
    } 
    else if (type === 'polygon' || type === 'rectangle') {
        const latlngs = layer.getLatLngs();
        dadosSalvos.polygons.push(latlngs);
    }
}

function removerLayerDoBanco(layer) {
    if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng();
        dadosSalvos.pins = dadosSalvos.pins.filter(p => p.lat !== latlng.lat || p.lng !== latlng.lng);
    }
}

function adicionarPopupDeletar(layer, itemData, tipoArray) {
    const conteudo = `
        <div>
            <b>${itemData.nome || 'Marcador'}</b><br><br>
            <button onclick="deletarItemEspecifico(${itemData.lat}, ${itemData.lng}, '${tipoArray}')" class="delete-btn" style="padding: 5px 10px; font-size: 12px; background: #d32f2f; color: white; border: none; border-radius: 4px; cursor: pointer;">🗑️ Excluir</button>
        </div>
    `;
    layer.bindPopup(conteudo);
}

function deletarItemEspecifico(lat, lng, tipoArray) {
    if (confirm("Deseja realmente excluir este item?")) {
        dadosSalvos[tipoArray] = dadosSalvos[tipoArray].filter(item => item.lat !== lat || item.lng !== lng);
        salvarNoJsonBin();
        carregarDoJsonBin();
    }
}

// ====================== REDESENHAR NA TELA ======================

function redesenharTudoNaTela() {
    if (dadosSalvos.pins) {
        dadosSalvos.pins.forEach(p => {
            const marker = L.marker([p.lat, p.lng]);
            adicionarPopupDeletar(marker, p, 'pins');
            drawnItems.addLayer(marker);
        });
    }

    if (dadosSalvos.polylines) {
        dadosSalvos.polylines.forEach(coords => {
            const polyline = L.polyline(coords, { color: '#0066cc', weight: 5 });
            drawnItems.addLayer(polyline);
        });
    }

    if (dadosSalvos.polygons) {
        dadosSalvos.polygons.forEach(coords => {
            const polygon = L.polygon(coords, { color: '#0066cc', weight: 5 });
            drawnItems.addLayer(polygon);
        });
    }
}

// ====================== FUNÇÕES DO MENU ======================

function adicionarTexto() {
    alert("Função de texto em desenvolvimento.");
}

function adicionarEmoji() {
    alert("Função de emoji em desenvolvimento.");
}

function limparTudo() {
    if (confirm("Tem certeza que deseja apagar TUDO do mapa?")) {
        dadosSalvos = { pins: [], texts: [], emojis: [], polylines: [], polygons: [] };
        drawnItems.clearLayers();
        salvarNoJsonBin();
    }
}

function exportarDados() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dadosSalvos));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "mapa_dados.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importarDados() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = readerEvent => {
            try {
                dadosSalvos = JSON.parse(readerEvent.target.result);
                salvarNoJsonBin();
                carregarDoJsonBin();
                alert("Dados importados com sucesso!");
            } catch (err) {
                alert("Erro ao ler o arquivo JSON.");
            }
        };
    };
    input.click();
}

// Inicializa o mapa ao carregar a página
window.onload = initMap;

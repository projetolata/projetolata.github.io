// ====================== CONFIGURAÇÕES ======================
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/6a5db19ef5f4af5e29a610ea";
const JSONBIN_KEY = "$2a$10$pUeAGxNW4YmEtB5xo1fNDO4fgRs/8aUaXgGUWD2.3inM38W4BsKGe";

let dadosSalvos = { pins: [], texts: [], emojis: [], polylines: [], polygons: [] };
let map, drawnItems;
let modoAdicaoAtivo = null;

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

    // Evento de clique esquerdo para colocar o pin com o texto/emoji onde o usuário clicar
    map.on('click', function(e) {
        if (!modoAdicaoAtivo) return;

        const novoPin = { 
            lat: e.latlng.lat, 
            lng: e.latlng.lng, 
            nome: modoAdicaoAtivo.valor 
        };

        dadosSalvos.pins.push(novoPin);
        adicionarPinNaTela(novoPin);

        salvarNoJsonBin();
        modoAdicaoAtivo = null;
        document.getElementById('map').style.cursor = '';
    });

    map.on(L.Draw.Event.CREATED, function (e) {
        const layer = e.layer;
        const type = e.layerType;

        if (type === 'marker') {
            const latlng = layer.getLatLng();
            const nome = prompt("Nome do pin:") || "Marcador";
            const pinData = { lat: latlng.lat, lng: latlng.lng, nome: nome };
            dadosSalvos.pins.push(pinData);
            adicionarPopupDeletar(layer, pinData, 'pins');
            drawnItems.addLayer(layer);
            salvarNoJsonBin();
        } else if (type === 'polyline') {
            dadosSalvos.polylines.push(layer.getLatLngs());
            drawnItems.addLayer(layer);
            salvarNoJsonBin();
        } else if (type === 'polygon' || type === 'rectangle') {
            dadosSalvos.polygons.push(layer.getLatLngs());
            drawnItems.addLayer(layer);
            salvarNoJsonBin();
        }
    });

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
    } catch (e) {
        console.error("Erro ao salvar dados:", e);
    }
}

// ====================== REMOÇÃO ======================

function removerLayerDoBanco(layer) {
    if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng();
        dadosSalvos.pins = dadosSalvos.pins.filter(p => p.lat !== latlng.lat || p.lng !== latlng.lng);
        dadosSalvos.texts = dadosSalvos.texts.filter(t => t.lat !== latlng.lat || t.lng !== latlng.lng);
        dadosSalvos.emojis = dadosSalvos.emojis.filter(e => e.lat !== latlng.lat || e.lng !== latlng.lng);
    }
}

function adicionarPopupDeletar(layer, itemData, tipoArray) {
    const nomeExibido = itemData.nome || 'Marcador';
    const conteudo = `
        <div style="text-align: center;">
            <b style="font-size: 14px;">${nomeExibido}</b><br><br>
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
        dadosSalvos.pins.forEach(p => adicionarPinNaTela(p));
    }

    // Compatibilidade com dados antigos salvos como texts ou emojis puros
    if (dadosSalvos.texts) {
        dadosSalvos.texts.forEach(t => {
            dadosSalvos.pins.push({ lat: t.lat, lng: t.lng, nome: t.texto });
            adicionarPinNaTela({ lat: t.lat, lng: t.lng, nome: t.texto });
        });
        dadosSalvos.texts = [];
    }

    if (dadosSalvos.emojis) {
        dadosSalvos.emojis.forEach(e => {
            dadosSalvos.pins.push({ lat: e.lat, lng: e.lng, nome: e.emoji });
            adicionarPinNaTela({ lat: e.lat, lng: e.lng, nome: e.emoji });
        });
        dadosSalvos.emojis = [];
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

function adicionarPinNaTela(p) {
    const marker = L.marker([p.lat, p.lng]);
    adicionarPopupDeletar(marker, p, 'pins');
    drawnItems.addLayer(marker);
}

// ====================== FUNÇÕES DO MENU INTERATIVO ======================

function adicionarTexto() {
    const texto = prompt("Digite o texto que deseja fixar no mapa:");
    if (!texto) return;

    modoAdicaoAtivo = { tipo: 'pin', valor: texto };
    document.getElementById('map').style.cursor = 'crosshair';
    alert("Agora clique no local exato do mapa onde deseja colocar o pin com este texto!");
}

function adicionarEmoji() {
    let modalAntigo = document.getElementById('modal-emoji');
    if (modalAntigo) modalAntigo.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-emoji';
    modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: white; padding: 20px; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.3);
        z-index: 2000; text-align: center; width: 320px; font-family: sans-serif;
    `;

    const listaEmojis = [
        "📍", "🚩", "⚔️", "🛡️", "🏰", "🏯", "⛺", "🛖", 
        "🌲", "🌳", "🪵", "⛰️", "🌋", "💧", "🌊", "🔥", 
        "💀", "🪙", "💰", "🗝️", "🚪", "🧭", "⭐", "❌", 
        "⚠️", "❓", "💡", "⛵", "🚢", "🐎", "🐉", "🐺"
    ];

    let gridHtml = listaEmojis.map(emo => `
        <button class="emoji-op" style="font-size: 20px; width: 35px; height: 35px; background: #f1f1f1; border: 1px solid #ddd; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; margin: auto;">${emo}</button>
    `).join('');

    modal.innerHTML = `
        <h3 style="margin-top: 0; color: #333; font-size: 16px;">Selecione um Emoji</h3>
        <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; margin-bottom: 12px; max-height: 180px; overflow-y: auto; padding: 4px;">
            ${gridHtml}
        </div>
        <input type="text" id="emoji-custom" placeholder="Ou digite outro aqui..." style="width: 85%; padding: 6px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; text-align: center;">
        <br>
        <button id="emoji-cancelar" style="background: #d32f2f; color: white; border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; font-size: 13px;">Cancelar</button>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll('.emoji-op').forEach(btn => {
        btn.onclick = () => {
            ativarSelecaoEmoji(btn.innerText.trim());
            modal.remove();
        };
    });

    modal.querySelector('#emoji-custom').onchange = (e) => {
        if (e.target.value) {
            ativarSelecaoEmoji(e.target.value.trim());
            modal.remove();
        }
    };

    modal.querySelector('#emoji-cancelar').onclick = () => modal.remove();
}

function ativarSelecaoEmoji(emojiChar) {
    modoAdicaoAtivo = { tipo: 'pin', valor: emojiChar };
    document.getElementById('map').style.cursor = 'crosshair';
    alert("Agora clique no local exato do mapa onde deseja colocar o pin!");
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

window.onload = initMap;

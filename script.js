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
        console.log("Mapa carregado com sucesso!");
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

    // Evento ao deletar elementos usando a ferramenta de edição
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
        dadosSalvos.polylines.push(layer.getLatLngs());
    } 
    else if (type === 'polygon' || type === 'rectangle') {
        dadosSalvos.polygons.push(layer.getLatLngs());
    }
}

function removerLayerDoBanco(layer) {
    if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng();
        dadosSalvos.pins = dadosSalvos.pins.filter(p => p.lat !== latlng.lat || p.lng !== latlng.lng);
        dadosSalvos.texts = dadosSalvos.texts.filter(t => t.lat !== latlng.lat || t.lng !== latlng.lng);
        dadosSalvos.emojis = dadosSalvos.emojis.filter(e => e.lat !== latlng.lat || e.lng !== latlng.lng);
    }
}

function adicionarPopupDeletar(layer, itemData, tipoArray) {
    const conteudo = `
        <div>
            <b>${itemData.nome || itemData.texto || itemData.emoji || 'Item'}</b><br><br>
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

    if (dadosSalvos.texts) {
        dadosSalvos.texts.forEach(t => {
            const textIcon = L.divIcon({
                className: 'custom-text-label',
                html: `<div style="background: rgba(255,255,255,0.85); padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 12px; border: 1px solid #ccc; white-space: nowrap;">${t.texto}</div>`,
                iconSize: [100, 20],
                iconAnchor: [50, 10]
            });
            const marker = L.marker([t.lat, t.lng], { icon: textIcon });
            adicionarPopupDeletar(marker, t, 'texts');
            drawnItems.addLayer(marker);
        });
    }

    if (dadosSalvos.emojis) {
        dadosSalvos.emojis.forEach(e => {
            const emojiIcon = L.divIcon({
                className: 'custom-emoji-label',
                html: `<div style="font-size: 24px; text-align: center; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${e.emoji}</div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });
            const marker = L.marker([e.lat, e.lng], { icon: emojiIcon });
            adicionarPopupDeletar(marker, e, 'emojis');
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

// ====================== FUNÇÕES DO MENU INTERATIVO ======================

function adicionarTexto() {
    const texto = prompt("Digite o texto que deseja fixar no mapa:");
    if (!texto) return;

    const center = map.getCenter();
    const novoTexto = { lat: center.lat, lng: center.lng, texto: texto };

    dadosSalvos.texts.push(novoTexto);
    salvarNoJsonBin();
    carregarDoJsonBin();
}

function adicionarEmoji() {
    // Cria uma janela modal simples na tela com opções visuais de emojis
    let modalAntigo = document.getElementById('modal-emoji');
    if (modalAntigo) modalAntigo.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-emoji';
    modal.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: white; padding: 20px; border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.3);
        z-index: 2000; text-align: center; width: 280px; font-family: sans-serif;
    `;

    modal.innerHTML = `
        <h3 style="margin-top: 0; color: #333;">Escolha um Emoji</h3>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px;">
            <button class="emoji-op" style="font-size: 24px; padding: 8px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">🏰</button>
            <button class="emoji-op" style="font-size: 24px; padding: 8px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">⚔️</button>
            <button class="emoji-op" style="font-size: 24px; padding: 8px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">🌲</button>
            <button class="emoji-op" style="font-size: 24px; padding: 8px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">📍</button>
            <button class="emoji-op" style="font-size: 24px; padding: 8px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">💀</button>
            <button class="emoji-op" style="font-size: 24px; padding: 8px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">🪙</button>
            <button class="emoji-op" style="font-size: 24px; padding: 8px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">🔥</button>
            <button class="emoji-op" style="font-size: 24px; padding: 8px; background: #f1f1f1; border: none; border-radius: 6px; cursor: pointer;">⛵</button>
        </div>
        <input type="text" id="emoji-custom" placeholder="Ou digite outro..." style="width: 80%; padding: 8px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 4px; text-align: center;">
        <br>
        <button id="emoji-cancelar" style="background: #d32f2f; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Cancelar</button>
    `;

    document.body.appendChild(modal);

    // Eventos de clique nas opções de emoji
    modal.querySelectorAll('.emoji-op').forEach(btn => {
        btn.onclick = () => {
            salvarEmojiNoMapa(btn.innerText);
            modal.remove();
        };
    });

    modal.querySelector('#emoji-custom').onchange = (e) => {
        if (e.target.value) {
            salvarEmojiNoMapa(e.target.value);
            modal.remove();
        }
    };

    modal.querySelector('#emoji-cancelar').onclick = () => modal.remove();
}

function salvarEmojiNoMapa(emojiChar) {
    const center = map.getCenter();
    const novoEmoji = { lat: center.lat, lng: center.lng, emoji: emojiChar };

    dadosSalvos.emojis.push(novoEmoji);
    salvarNoJsonBin();
    carregarDoJsonBin();
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

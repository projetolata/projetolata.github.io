// ================= CONFIGURAÇÕES DO GITHUB =================
const GITHUB_TOKEN = "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"; // Cole seu token clássico do GitHub aqui
const USERNAME = "projetolata";
const REPO = "projetolata.github.io";
const FILE_PATH = "pins.json";
// ==========================================================

// Configurando o Mapa e o Zoom
const bounds = [[0,0], [1000,1000]]; 
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 3,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0
});
map.fitBounds(bounds);

// Carrega o mapa direto da imagem local
L.imageOverlay('./mapa0001a.png', bounds).addTo(map);

// Estado atual das ferramentas
let ferramentaAtiva = 'pin'; // 'pin', 'texto', 'pincel'
let corPinAtual = 'red';
let emojiAtual = '📍';
let dadosSalvos = { pins: [], textos: [], tracos: [] };
let elementosNaTela = {};

// Criando a Barra de Ferramentas Visual na Tela
const barraUI = L.control({position: 'topright'});
barraUI.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'barra-ferramentas');
    div.style.background = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.fontSize = '12px';
    div.style.zIndex = '1000';

    div.innerHTML = `
        <b style="display:block; margin-bottom:5px;">Ferramentas</b>
        <label><input type="radio" name="ferramenta" value="pin" checked> Pin / Marcador</label><br>
        <label><input type="radio" name="ferramenta" value="texto"> Caixa de Texto</label><br>
        <label><input type="radio" name="ferramenta" value="pincel"> Pincel (Traço)</label>
        <hr style="margin: 8px 0; border:0; border-top:1px solid #ddd;">
        
        <div id="opcoes-pin">
            <b>Cor do Pin:</b><br>
            <select id="select-cor" style="width:100%; margin-bottom:5px;">
                <option value="red">Vermelho</option>
                <option value="blue">Azul</option>
                <option value="green">Verde</option>
                <option value="gold">Amarelo</option>
                <option value="violet">Roxo</option>
            </select>
            <b>Emoji:</b><br>
            <select id="select-emoji" style="width:100%;">
                <option value="📍">📍 Pin Padrão</option>
                <option value="⭐">⭐ Estrela</option>
                <option value="💀">💀 Caveira</option>
                <option value="🚩">🚩 Bandeira</option>
                <option value="🔥">🔥 Fogo</option>
                <option value="⚔️">⚔️ Espadas</option>
            </select>
        </div>
    `;

    // Evita cliques na barra arrastarem o mapa
    L.DomEvent.disableClickPropagation(div);
    return div;
};
barraUI.addTo(map);

// Controlar mudança de ferramentas
document.addEventListener('change', (e) => {
    if (e.target.name === 'ferramenta') {
        ferramentaAtiva = e.target.value;
        const painelPin = document.getElementById('opcoes-pin');
        if (painelPin) {
            painelPin.style.display = (ferramentaAtiva === 'pin') ? 'block' : 'none';
        }
    }
    if (e.target.id === 'select-cor') corPinAtual = e.target.value;
    if (e.target.id === 'select-emoji') emojiAtual = e.target.value;
});

// ================= SINCRONIZAÇÃO COM O GITHUB =================
async function carregarDados() {
    try {
        const response = await fetch(`https://api.github.com/repos/${USERNAME}/${REPO}/contents/${FILE_PATH}`);
        if (response.ok) {
            const data = await response.json();
            const jsonString = decodeURIComponent(escape(atob(data.content)));
            dadosSalvos = JSON.parse(jsonString);
            
            if(!dadosSalvos.pins) dadosSalvos.pins = [];
            if(!dadosSalvos.textos) dadosSalvos.textos = [];
            if(!dadosSalvos.tracos) dadosSalvos.tracos = [];

            // Desenhar tudo na tela
            dadosSalvos.pins.forEach(p => desenharPinVisual(p));
            dadosSalvos.textos.forEach(t => desenharTextoVisual(t));
            dadosSalvos.tracos.forEach(tr => desenharTracoVisual(tr));
        }
    } catch (e) {
        console.log("Iniciando novo arquivo de dados no repositório.");
    }
}

async function salvarNoGithub() {
    try {
        const getRes = await fetch(`https://api.github.com/repos/${USERNAME}/${REPO}/contents/${FILE_PATH}`, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });
        
        let sha = null;
        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
        }

        const jsonString = JSON.stringify(dadosSalvos, null, 2);
        const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));

        const bodyData = {
            message: "Atualização de elementos do mapa (Pins, Textos e Pincel)",
            content: contentBase64
        };
        if (sha) bodyData.sha = sha;

        await fetch(`https://api.github.com/repos/${USERNAME}/${REPO}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bodyData)
        });
    } catch (e) {
        console.error("Erro ao salvar dados no GitHub:", e);
    }
}

// ================= FUNÇÕES DE DESENHO E INTERAÇÃO =================

// 1. Pins com Cores e Emojis personalizados
function desenharPinVisual(p) {
    // Criando um icone customizado com emoji usando HTML do Leaflet
    const iconeCustom = L.divIcon({
        className: 'custom-emoji-pin',
        html: `<div style="font-size: 24px; text-shadow: 0 0 3px white, 0 0 3px white; text-align:center;">${p.emoji || '📍'}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const marker = L.marker([p.lat, p.lng], {icon: iconeCustom}).addTo(map);
    
    const popupContent = document.createElement('div');
    popupContent.innerHTML = `
        <strong style="font-size: 14px;">${p.name}</strong><br>
        <button class="btn-excluir" style="margin-top: 8px; color: white; background: red; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Excluir Pin</button>
    `;

    popupContent.querySelector('.btn-excluir').addEventListener('click', async () => {
        if(confirm("Deletar este ponto?")) {
            map.removeLayer(marker);
            dadosSalvos.pins = dadosSalvos.pins.filter(item => item.id !== p.id);
            await salvarNoGithub();
        }
    });

    marker.bindPopup(popupContent);
    elementosNaTela[p.id] = marker;
}

// 2. Caixas de Texto Livres no Mapa
function desenharTextoVisual(t) {
    const textIcon = L.divIcon({
        className: 'custom-text-label',
        html: `<div style="background: rgba(255,255,255,0.85); padding: 3px 6px; border: 1px solid #333; border-radius: 4px; font-weight: bold; font-size: 13px; white-space: nowrap; cursor: pointer;">${t.text}</div>`,
        iconAnchor: [0, 0]
    });

    const marker = L.marker([t.lat, t.lng], {icon: textIcon}).addTo(map);
    
    marker.on('click', async () => {
        if(confirm(`Deseja apagar o texto "${t.text}"?`)) {
            map.removeLayer(marker);
            dadosSalvos.textos = dadosSalvos.textos.filter(item => item.id !== t.id);
            await salvarNoGithub();
        }
    });

    elementosNaTela[t.id] = marker;
}

// 3. Linhas do Pincel
function desenharTracoVisual(tr) {
    const polyline = L.polyline(tr.pontos, {color: tr.cor || '#ff0000', weight: 4}).addTo(map);
    
    polyline.on('click', async () => {
        if(confirm("Deseja apagar este traço?")) {
            map.removeLayer(polyline);
            dadosSalvos.tracos = dadosSalvos.tracos.filter(item => item.id !== tr.id);
            await salvarNoGithub();
        }
    });

    elementosNaTela[tr.id] = polyline;
}

// Evento de clique no mapa dependendo da ferramenta selecionada
map.on('click', async function(e) {
    if (ferramentaAtiva === 'pin') {
        let text = prompt("Nome do local / Pin:");
        if (text) {
            const novoPin = {
                id: 'pin_' + Date.now(),
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                name: text,
                cor: corPinAtual,
                emoji: emojiAtual
            };
            dadosSalvos.pins.push(novoPin);
            desenharPinVisual(novoPin);
            await salvarNoGithub();
        }
    } 
    else if (ferramentaAtiva === 'texto') {
        let textoLivre = prompt("Digite o texto que deseja fixar no mapa:");
        if (textoLivre) {
            const novoTexto = {
                id: 'txt_' + Date.now(),
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                text: textoLivre
            };
            dadosSalvos.textos.push(novoTexto);
            desenharTextoVisual(novoTexto);
            await salvarNoGithub();
        }
    }
});

// Modo Pincel (Arrastar o mouse para desenhar linhas livres)
let desenhando = null;
let pontosAtuais = null;

map.on('mousedown', function(e) {
    if (ferramentaAtiva === 'pincel') {
        map.dragging.disable(); // Desativa o arrasto do mapa para desenhar livremente
        pontosAtuais = [ [e.latlng.lat, e.latlng.lng] ];
        desenhando = L.polyline(pontosAtuais, {color: '#ff0000', weight: 4}).addTo(map);
    }
});

map.on('mousemove', function(e) {
    if (ferramentaAtiva === 'pincel' && desenhando) {
        pontosAtuais.push([e.latlng.lat, e.latlng.lng]);
        desenhando.setLatLngs(pontosAtuais);
    }
});

map.on('mouseup', async function(e) {
    if (ferramentaAtiva === 'pincel' && desenhando) {
        map.dragging.enable(); // Reativa o arrasto do mapa
        const novoTraco = {
            id: 'trc_' + Date.now(),
            pontos: pontosAtuais,
            cor: '#ff0000'
        };
        dadosSalvos.tracos.push(novoTraco);
        await salvarNoGithub();
        desenhando = null;
        pontosAtuais = null;
    }
});

// Inicializa baixando tudo do repositório
carregarDados();

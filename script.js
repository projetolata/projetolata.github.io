import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, remove, onChildRemoved } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const markersRef = ref(db, 'markers');

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

// Carrega o mapa direto da imagem local/repositório
L.imageOverlay('./mapa0001a.png', bounds).addTo(map);

// Sistema de Pins (Adicionar)
map.on('click', function(e) {
    let text = prompt("Nome do local:");
    if (text) {
        push(markersRef, {
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            name: text
        });
    }
});

const marcadoresNaTela = {};

// Recebendo e desenhando os pins em tempo real
onChildAdded(markersRef, (snapshot) => {
    const key = snapshot.key;
    const data = snapshot.val();

    const marker = L.marker([data.lat, data.lng]).addTo(map);
    
    const popupContent = document.createElement('div');
    popupContent.innerHTML = `
        <strong style="font-size: 14px;">${data.name}</strong><br>
        <button class="btn-excluir" style="margin-top: 8px; color: white; background: red; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Excluir Pin</button>
    `;

    popupContent.querySelector('.btn-excluir').addEventListener('click', () => {
        if(confirm("Tem certeza que quer deletar este ponto?")) {
            remove(ref(db, `markers/${key}`));
        }
    });

    marker.bindPopup(popupContent);
    marcadoresNaTela[key] = marker;
});

// Removendo pins em tempo real
onChildRemoved(markersRef, (snapshot) => {
    const key = snapshot.key;
    if (marcadoresNaTela[key]) {
        map.removeLayer(marcadoresNaTela[key]);
        delete marcadoresNaTela[key];
    }
});
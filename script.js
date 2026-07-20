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

// Sistema de Pins direto na tela
map.on('click', function(e) {
    let text = prompt("Nome do local:");
    if (text) {
        const marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
        
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `
            <strong style="font-size: 14px;">${text}</strong><br>
            <button class="btn-excluir" style="margin-top: 8px; color: white; background: red; border: none; padding: 4px 8px; cursor: pointer; border-radius: 4px;">Excluir Pin</button>
        `;

        popupContent.querySelector('.btn-excluir').addEventListener('click', () => {
            if(confirm("Tem certeza que quer deletar este ponto?")) {
                map.removeLayer(marker);
            }
        });

        marker.bindPopup(popupContent);
    }
});
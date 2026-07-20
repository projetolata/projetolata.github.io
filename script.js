// 1. IMPORTAÇÕES NOVAS (Adicionando o Storage e o onValue do Database)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, remove, onChildRemoved, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// ... (Suas credenciais firebaseConfig continuam aqui) ...
const firebaseConfig = {
  apiKey: "AIzaSyCCd1dE-3uulvvp7RoTHXmd-c5MKSLEOTo",
  authDomain: "minemine-c00d5.firebaseapp.com",
  projectId: "minemine-c00d5",
  storageBucket: "minemine-c00d5.firebasestorage.app",
  messagingSenderId: "65626707381",
  appId: "1:65626707381:web:10492c08ebf852d212b5fc",
  measurementId: "G-XKDQWRNZYG"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app); // Iniciando o Storage
const markersRef = ref(db, 'markers');

// 2. CONFIGURANDO O MAPA E O ZOOM
const bounds = [[0,0], [1000,1000]]; 
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 3,
    maxBounds: bounds,
    maxBoundsViscosity: 1.0
});
map.fitBounds(bounds);

let camadaDoMapa = null; // Variável para guardar a imagem atual

// 3. LÓGICA DE ATUALIZAÇÃO DA IMAGEM EM TEMPO REAL
// O Firebase vai escutar qual é a URL do mapa oficial agora
onValue(ref(db, 'config/mapaAtual'), (snapshot) => {
    const urlDaImagem = snapshot.val() || 'atlas-2026-07-20_00.14.32.jpg'; // Se não tiver nada no banco, usa a original

    // Se já existir um mapa na tela, remove ele antes de colocar o novo
    if (camadaDoMapa) {
        map.removeLayer(camadaDoMapa);
    }

    // Aplica a nova imagem
    camadaDoMapa = L.imageOverlay(urlDaImagem, bounds).addTo(map);
    camadaDoMapa.bringToBack(); // Joga a imagem pro fundo para não cobrir os pins
});

// 4. LÓGICA DO BOTÃO DE UPLOAD
const inputUpload = document.getElementById('upload-mapa');
const statusTexto = document.getElementById('status-upload');

inputUpload.addEventListener('change', async (event) => {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    statusTexto.innerText = "Enviando arquivo...";
    
    try {
        const nomeUnico = `mapa_fundo_${Date.now()}.png`;
        const caminhoNoStorage = storageRef(storage, nomeUnico); 
        
        // Faz o upload
        await uploadBytes(caminhoNoStorage, arquivo);
        
        // Pega o Link público da imagem que acabou de subir
        const linkPublico = await getDownloadURL(caminhoNoStorage);

        // Salva esse Link no Database para todo mundo atualizar a tela na hora
        await set(ref(db, 'config/mapaAtual'), linkPublico);
        
        statusTexto.innerText = "Mapa atualizado com sucesso!";
        setTimeout(() => statusTexto.innerText = "", 3000);
        
    } catch (erro) {
        console.error(erro);
        statusTexto.innerText = "Erro ao enviar imagem.";
    }
});

// ... (O resto do seu código de Eventos de Pins e Exclusão continua normal abaixo daqui) ...
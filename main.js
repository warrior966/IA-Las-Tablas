// ==========================================
// 1. IMPORTACIONES DE LOS SDKs DESDE CDN
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 2. CONFIGURACIÓN DE TU PROYECTO FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyATYgYQyNBTcGyUinHyzDCW-JleRLkumwY",
  authDomain: "prueba-ia-d6099.firebaseapp.com",
  projectId: "prueba-ia-d6099",
  storageBucket: "prueba-ia-d6099.firebasestorage.app",
  messagingSenderId: "1059491393827",
  appId: "1:1059491393827:web:319ed9d9bb5399bdb0dc96"
};

// Inicializar Firebase y Servicios
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ==========================================
// 3. CAPTURA DE ELEMENTOS DEL DOM
// ==========================================
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const chatArea = document.getElementById("chat-area");
const messageInput = document.getElementById("message-input");
const sendBtn = document.getElementById("send-btn");
const userProfile = document.getElementById("user-profile");

let currentUser = null;
let unsubscribeChat = null;

// ==========================================
// 4. FLUJO DE AUTENTICACIÓN (AUTH)
// ==========================================

loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider).catch(err => console.error("Error login:", err));
});

logoutBtn.addEventListener("click", () => {
  signOut(auth).catch(err => console.error("Error logout:", err));
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "block";
    messageInput.disabled = false;
    sendBtn.disabled = false;
    userProfile.textContent = user.displayName;
    
    // Activa la escucha en tiempo real de su subcolección privada
    activarEscuchaChat(user.uid);
  } else {
    currentUser = null;
    loginBtn.style.display = "block";
    logoutBtn.style.display = "none";
    messageInput.disabled = true;
    sendBtn.disabled = true;
    userProfile.textContent = "";
    chatArea.innerHTML = `
      <div class="placeholder-text">
        <p>Por favor, inicia sesión con tu cuenta de Google para comenzar a chatear con la IA.</p>
      </div>`;
    
    if (unsubscribeChat) {
      unsubscribeChat();
      unsubscribeChat = null;
    }
  }
});

// ==========================================
// 5. GESTIÓN DE MENSAJES (FIRESTORE + AI LOGIC)
// ==========================================

async function enviarMensaje() {
  const texto = messageInput.value.trim();
  if (!texto || !currentUser) return;

  try {
    messageInput.value = ""; // Limpieza rápida del input para fluidez del usuario
    
    // Añadimos el documento a la colección que tu extensión Firebase AI Logic escucha
    await addDoc(collection(db, `users/${currentUser.uid}/chats`), {
      prompt: texto,
      createdAt: new Date(),
      userId: currentUser.uid
    });
    
  } catch (error) {
    console.error("Error al enviar documento:", error);
  }
}

sendBtn.addEventListener("click", enviarMensaje);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") enviarMensaje();
});

function activarEscuchaChat(userId) {
  const q = query(
    collection(db, `users/${userId}/chats`), 
    orderBy("createdAt", "asc")
  );

  unsubscribeChat = onSnapshot(q, (snapshot) => {
    chatArea.innerHTML = "";
    
    if (snapshot.empty) {
      chatArea.innerHTML = `
        <div class="placeholder-text">
          <p>¡Historial vacío! Envía un mensaje y la extensión de IA te responderá aquí.</p>
        </div>`;
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // 1. Renderizar mensaje del usuario
      if (data.prompt) {
        chatArea.innerHTML += `
          <div class="message user-message">
            <span class="sender">Tú</span>
            <div class="text">${data.prompt}</div>
          </div>
        `;
      }

      // 2. Renderizar respuesta de Firebase AI Logic (Gemini)
      // Ajusta 'response' si en tu extensión configuraste otro nombre de salida (ej. 'output')
      if (data.response) {
        chatArea.innerHTML += `
          <div class="message ai-message">
            <span class="sender">IA</span>
            <div class="text">${data.response}</div>
          </div>
        `;
      } else if (data.status && data.status.state === "PROCESSING") {
        // Muestra estado de carga si la extensión está procesando la respuesta
        chatArea.innerHTML += `
          <div class="message ai-message loading">
            <span class="sender">IA</span>
            <div class="text">Pensando...</div>
          </div>
        `;
      }
    });
    
    // Auto-scroll automático al final
    chatArea.scrollTop = chatArea.scrollHeight;
  });
}

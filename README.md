# IA Las Tablas

Asistente con OpenAI, Firebase Authentication y Firestore, desplegable en Render. No utiliza Firebase Cloud Functions ni Firebase Hosting.

## Incluye
- Registro e inicio de sesión por correo y Google.
- Conversaciones y mensajes guardados por usuario en Firestore.
- Memoria editable por usuario.
- Chat con GPT-6 Astra mediante la API de OpenAI y generación de imágenes.
- Lectura de PDF, DOCX, TXT, Markdown, CSV y archivos de código.
- Asistencia para programación.

## Configuración
1. Crea un proyecto Firebase y activa Authentication (correo/contraseña y Google) y Firestore.
2. Copia la configuración de la aplicación web a las variables VITE_FIREBASE_* de Render.
3. Genera una clave privada de Firebase Admin SDK. Guarda el JSON completo en el secreto FIREBASE_SERVICE_ACCOUNT de Render. No lo subas a GitHub.
4. Añade OPENAI_API_KEY como secreto en Render. El chat usa OPENAI_MODEL=gpt-6-astra por defecto y un esfuerzo de razonamiento medium. La cuenta de API debe tener acceso a GPT-6 Astra. La generación de imágenes usa OPENAI_IMAGE_MODEL=gpt-image-1.
5. Crea un Web Service conectado a este repositorio. Build: npm install && npm run build. Start: npm start. Node 20.
6. Las variables VITE_FIREBASE_* se incorporan durante la compilación: configúralas antes del primer deploy y vuelve a desplegar si cambian.

## Reglas de Firestore
En Firebase Console > Firestore > Rules, puedes empezar con:

    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{uid}/{document=**} {
          allow read, write: if request.auth != null && request.auth.uid == uid;
        }
      }
    }

## Seguridad
OPENAI_API_KEY y FIREBASE_SERVICE_ACCOUNT son secretos solo del servidor. Nunca deben tener prefijo VITE_. La configuración VITE_FIREBASE_* es visible en el navegador: restringe la API key por dominios. El servidor verifica el ID token de Firebase en cada endpoint privado. Los adjuntos se procesan en memoria y no se guardan como archivos. La memoria es editable manualmente en esta versión.

## Desarrollo
Crea .env a partir de .env.example, ejecuta npm install y npm run build; npm start sirve la aplicación compilada y API desde Express. Para desarrollo frontend, npm run dev.

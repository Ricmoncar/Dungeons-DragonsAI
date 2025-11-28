# 🐉 DND_IA: Tu Dungeon Master con Inteligencia Artificial

Bienvenido a **DND_IA**, una aplicación web moderna para jugar campañas de Dungeons & Dragons dirigidas por una IA avanzada.

## ✨ Características Principales

- **Dungeon Master IA**: Utiliza **Deepseek** y **Groq** para narrar historias, reaccionar a tus acciones y controlar el mundo.
- **Creación de Personajes**: Sistema guiado para crear tu héroe, con historias de origen generadas por IA.
- **Hoja de Personaje Dinámica**: Gestiona tu inventario, estadísticas y nivel. ¡La IA puede darte objetos y experiencia automáticamente!
- **Tiradas de Dados 3D**: Lanza d20, d6, etc. directamente en el chat con animaciones realistas.
- **Multijugador Asíncrono**: Busca amigos y mira sus perfiles (sistema de juego en grupo en desarrollo).
- **Interfaz Inmersiva**: Diseño "Glassmorphism" con fondos animados y modo oscuro.

## 🚀 Cómo Iniciar la Aplicación

Sigue estos pasos para ejecutar el proyecto en tu ordenador.

### 1. Requisitos Previos
- Tener **Node.js** instalado.
- Tener el archivo `service-account-key.json` en la carpeta `backend/` (¡CRÍTICO!).

### 2. Configuración
Asegúrate de que los archivos `.env` en `backend/` y `frontend/` tengan las claves correctas.
- **Backend**: Necesita `DEEPSEEK_API_KEY`, `GROQ_API_KEY` y `GOOGLE_APPLICATION_CREDENTIALS`.
- **Frontend**: Necesita las claves de configuración de Firebase.

### 3. Iniciar el Servidor (Backend)
Abre una terminal en la carpeta `backend` y ejecuta:
```bash
npm install  # Solo la primera vez
node src/server.js
```
Verás: `Server running on port 5000`.

### 4. Iniciar la Web (Frontend)
Abre **otra** terminal en la carpeta `frontend` y ejecuta:
```bash
npm install  # Solo la primera vez
npm run dev
```
Verás un enlace (ej. `http://localhost:5173`). ¡Ábrelo en tu navegador y a jugar!

---

## 🛠️ Tecnologías Usadas
- **Frontend**: React, Vite, TailwindCSS (estilo vanilla), Firebase Auth/Realtime Database.
- **Backend**: Node.js, Express, Firebase Admin SDK.
- **IA**: Deepseek (Narrativa), Groq (Lógica rápida).

¡Que disfrutes de tu aventura! 🎲

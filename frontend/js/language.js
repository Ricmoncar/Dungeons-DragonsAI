/**
 * Language Support Module
 * Handles English/Spanish translation and persistence
 */

const translations = {
    en: {
        // Login Page
        'login-title': 'Enter the Realm',
        'username-label': 'Username',
        'username-placeholder': 'Choose your adventurer name',
        'email-label': 'Email',
        'password-label': 'Password',
        'submit-btn-login': 'Enter World',
        'submit-btn-signup': 'Begin Adventure',
        'toggle-text-login': "Don't have an account? ",
        'toggle-text-signup': 'Already have an account? ',
        'toggle-btn-signup': 'Sign up',
        'toggle-btn-login': 'Login',

        // Sidebar
        'settings-btn': '⚙️ Settings',
        'logout-btn': '🚪 Logout',

        // Dashboard
        'hp-text': 'HP',
        'typing-indicator': 'AI is conjuring a response',
        'chat-placeholder': 'What do you want to do?',
        'send-btn': 'Send',

        // Character Sheet Modal
        'char-info-title': 'Character Info',
        'name-label': 'Name',
        'race-label': 'Race',
        'class-label': 'Class',
        'appearance-label': 'Appearance',
        'char-stats-title': 'Character Stats',
        'level-label': 'Level',
        'xp-label': 'XP',
        'hp-label': 'HP',
        'points-label': 'Points',
        'attributes-title': 'Attributes',
        'points-available-badge': 'points available',
        'inventory-title-modal': 'Inventory',
        'items-count': 'items',
        'empty-inventory-modal': 'No items yet. Adventure awaits!',
        'delete-item-confirm': 'Delete this item?',
        'item-deleted': 'Item deleted',
        'attribute-increased': 'increased!',
        'defeated-msg': '💀 You have been defeated!',
        'attr-str': 'STR',
        'attr-dex': 'DEX',
        'attr-con': 'CON',
        'attr-int': 'INT',
        'attr-wis': 'WIS',
        'attr-cha': 'CHA',

        // Notifications
        'level-up-title': 'LEVEL UP!',
        'level-up-subtitle': "You've gained 1 attribute point!",
        'new-item-title': 'New Item!',

        // Character Sheet
        'char-sheet-title': 'Character Sheet',
        'stats-title': 'Attributes',
        'inventory-title': 'Inventory',
        'points-available': 'Points Available:',
        'empty-inventory': 'Your inventory is empty. Go find some loot!',

        // Stats
        'str-label': 'Strength',
        'dex-label': 'Dexterity',
        'con-label': 'Constitution',
        'int-label': 'Intelligence',
        'wis-label': 'Wisdom',
        'cha-label': 'Charisma',

        // Notifications
        'campaign-select-error': 'Please select a campaign first',
        'sending': 'Sending...',
        'send': 'Send',

        // Auth Dynamic
        'login-title-login': 'Enter the Realm',
        'login-title-signup': 'Join the Adventure',
        'submit-btn-login': 'Enter World',
        'submit-btn-signup': 'Create Character',
        'entering': 'Entering...',
        'creating': 'Creating...',
        'toggle-text-login': "Don't have an account? ",
        'toggle-text-signup': 'Already have an account? ',
        'toggle-btn-signup': 'Sign up',
        'toggle-btn-login': 'Login',

        // Profile Dynamic
        'level-prefix': 'Level',
        'xp-prefix': 'Experience'
    },
    es: {
        // Login Page
        'login-title': 'Entra al Reino',
        'username-label': 'Nombre de Usuario',
        'username-placeholder': 'Elige tu nombre de aventurero',
        'email-label': 'Correo Electrónico',
        'password-label': 'Contraseña',
        'submit-btn-login': 'Entrar al Mundo',
        'submit-btn-signup': 'Comenzar Aventura',
        'toggle-text-login': '¿No tienes cuenta? ',
        'toggle-text-signup': '¿Ya tienes cuenta? ',
        'toggle-btn-signup': 'Regístrate',
        'toggle-btn-login': 'Inicia Sesión',

        // Sidebar
        'settings-btn': '⚙️ Configuración',
        'logout-btn': '🚪 Cerrar Sesión',

        // Dashboard
        'hp-text': 'PV',
        'typing-indicator': 'La IA está conjurando una respuesta',
        'chat-placeholder': '¿Qué quieres hacer?',
        'send-btn': 'Enviar',

        // Character Sheet Modal
        'char-info-title': 'Info del Personaje',
        'name-label': 'Nombre',
        'race-label': 'Raza',
        'class-label': 'Clase',
        'appearance-label': 'Apariencia',
        'char-stats-title': 'Estadísticas',
        'level-label': 'Nivel',
        'xp-label': 'EXP',
        'hp-label': 'PV',
        'points-label': 'Puntos',
        'attributes-title': 'Atributos',
        'points-available-badge': 'puntos disponibles',
        'inventory-title-modal': 'Inventario',
        'items-count': 'objetos',
        'empty-inventory-modal': 'Sin objetos aún. ¡La aventura espera!',
        'delete-item-confirm': '¿Borrar este objeto?',
        'item-deleted': 'Objeto borrado',
        'attribute-increased': 'aumentado!',
        'defeated-msg': '💀 ¡Has sido derrotado!',
        'attr-str': 'FUE',
        'attr-dex': 'DES',
        'attr-con': 'CON',
        'attr-int': 'INT',
        'attr-wis': 'SAB',
        'attr-cha': 'CAR',

        // Notifications
        'level-up-title': '¡SUBIDA DE NIVEL!',
        'level-up-subtitle': '¡Has ganado 1 punto de atributo!',
        'new-item-title': '¡Nuevo Objeto!',

        // Character Sheet
        'char-sheet-title': 'Hoja de Personaje',
        'stats-title': 'Atributos',
        'inventory-title': 'Inventario',
        'points-available': 'Puntos Disponibles:',
        'empty-inventory': 'Tu inventario está vacío. ¡Ve a buscar botín!',

        // Stats
        'str-label': 'Fuerza',
        'dex-label': 'Destreza',
        'con-label': 'Constitución',
        'int-label': 'Inteligencia',
        'wis-label': 'Sabiduría',
        'cha-label': 'Carisma',

        // Notifications
        'campaign-select-error': 'Por favor selecciona una campaña primero',
        'sending': 'Enviando...',
        'send': 'Enviar',

        // Auth Dynamic
        'login-title-login': 'Entra al Reino',
        'login-title-signup': 'Únete a la Aventura',
        'submit-btn-login': 'Entrar al Mundo',
        'submit-btn-signup': 'Crear Personaje',
        'entering': 'Entrando...',
        'creating': 'Creando...',
        'toggle-text-login': '¿No tienes cuenta? ',
        'toggle-text-signup': '¿Ya tienes cuenta? ',
        'toggle-btn-signup': 'Regístrate',
        'toggle-btn-login': 'Inicia Sesión',

        // Profile Dynamic
        'level-prefix': 'Nivel',
        'xp-prefix': 'Experiencia'
    }
};

let currentLanguage = localStorage.getItem('dnd_ia_language') || 'en';

export function initLanguage() {
    applyLanguage(currentLanguage);
    updateToggleUI();

    const toggleBtn = document.getElementById('language-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleLanguage);
    }
}

export function toggleLanguage() {
    currentLanguage = currentLanguage === 'en' ? 'es' : 'en';
    localStorage.setItem('dnd_ia_language', currentLanguage);
    applyLanguage(currentLanguage);
    updateToggleUI();
    return currentLanguage;
}

export function getCurrentLanguage() {
    return currentLanguage;
}

export function getTranslation(key) {
    return translations[currentLanguage][key] || key;
}

function applyLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
                element.placeholder = translations[lang][key];
            } else {
                element.textContent = translations[lang][key];
            }
        }
    });

    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

function updateToggleUI() {
    const toggleBtn = document.getElementById('language-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = currentLanguage === 'en' ? '🇪🇸 ES' : '🇺🇸 EN';
        toggleBtn.title = currentLanguage === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés';
    }
}

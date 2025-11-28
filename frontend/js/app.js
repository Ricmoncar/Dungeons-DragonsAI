// Main Application Entry Point
import { auth, database } from './config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { initAuth } from './auth.js';
import { initChat } from './chat.js';
import { initProfile } from './profile.js';
import { initFriends } from './friends.js';
import { initCharacter } from './character.js';
import { initDice } from './dice.js';
import { initNotifications } from './notifications.js';
import { showCinematicIntro } from './intro.js';
import { initCampaigns } from './campaigns.js';
import { initLanguage, getTranslation } from './language.js';

// Global State
export const appState = {
    currentUser: null,
    userData: null,
    currentPage: 'login'
};

// Router
export function navigateTo(page) {
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');

    if (page === 'login') {
        loginPage.classList.remove('hidden');
        dashboardPage.classList.add('hidden');
        appState.currentPage = 'login';
    } else if (page === 'dashboard') {
        loginPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        appState.currentPage = 'dashboard';
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DND_IA App initializing...');

    // Show cinematic intro
    showCinematicIntro();

    // Initialize all modules
    initLanguage();
    initAuth();
    initChat();
    initProfile();
    initFriends();
    initCharacter();
    initDice();
    initNotifications();
    initCampaigns();

    // Auth state observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User signed in:', user.email);
            appState.currentUser = user;

            // Fetch user data from database
            const userRef = ref(database, 'users/' + user.uid);
            onValue(userRef, (snapshot) => {
                const data = snapshot.val();
                appState.userData = data;
                console.log('User data loaded:', data);

                // Update profile display
                if (data) {
                    updateUserProfile(data, user);
                }
            });

            navigateTo('dashboard');
        } else {
            console.log('User signed out');
            appState.currentUser = null;
            appState.userData = null;
            navigateTo('login');
        }
    });
});

// Update user profile display
function updateUserProfile(userData, user) {
    const usernameEl = document.getElementById('profile-username');
    const levelEl = document.getElementById('profile-level');
    const xpEl = document.getElementById('profile-xp');
    const avatarEl = document.getElementById('profile-avatar');
    const xpBarFill = document.getElementById('xp-bar-fill');

    if (usernameEl) {
        usernameEl.textContent = userData.username || user.email;
    }

    if (levelEl) {
        const levelPrefix = getTranslation('level-prefix');
        levelEl.textContent = `${levelPrefix} ${userData.level || 1}`;
    }

    if (xpEl) {
        const currentXp = userData.xp || 0;
        const maxXp = 100;
        const xpPrefix = getTranslation('xp-prefix');
        xpEl.textContent = `${xpPrefix}: ${currentXp} / ${maxXp}`;

        if (xpBarFill) {
            xpBarFill.style.width = `${(currentXp / maxXp) * 100}%`;
        }
    }

    if (avatarEl && userData.username) {
        avatarEl.textContent = userData.username[0].toUpperCase();
    }
}

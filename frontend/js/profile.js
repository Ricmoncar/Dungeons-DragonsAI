/**
 * Profile Settings Module
 * User profile editor and account management
 */

import { auth, database } from './config.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { ref, update, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { appState, navigateTo } from './app.js';
import { showNotification } from './notifications.js';
import { getTranslation } from './language.js';

export function initProfile() {
    // Listen for settings button
    const checkInterval = setInterval(() => {
        const settingsBtn = document.getElementById('open-settings');
        const logoutBtn = document.getElementById('logout-btn');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', openSettings);
            clearInterval(checkInterval);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
    }, 100);
}

// Open settings modal
function openSettings() {
    const modal = createSettingsModal();
    document.body.appendChild(modal);

    // Load current data
    loadUserSettings();

    // Animate in
    setTimeout(() => modal.classList.add('show'), 10);
}

// Create settings modal
function createSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'settings-modal';

    modal.innerHTML = `
        <div class="modal-content settings-content">
            <div class="modal-header">
                <h2>⚙️ User Settings</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>

            <div class="settings-body">
                <!-- Profile Settings -->
                <div class="settings-section">
                    <h3>Profile Information</h3>
                    
                    <div class="input-group">
                        <label class="input-label" for="settings-username">Username</label>
                        <input type="text" id="settings-username" class="input-field" placeholder="Your username" />
                    </div>

                    <div class="input-group">
                        <label class="input-label" for="settings-email">Email</label>
                        <input type="email" id="settings-email" class="input-field" disabled />
                        <small class="input-hint">Email cannot be changed</small>
                    </div>

                    <button class="btn btn-primary" id="save-profile-btn">
                        💾 Save Changes
                    </button>
                </div>

                <!-- Account Management -->
                <div class="settings-section">
                    <h3>Account Management</h3>
                    
                    <div class="settings-info-box">
                        <p><strong>Current Account:</strong> <span id="current-account-email">Loading...</span></p>
                        <p><strong>User ID:</strong> <span id="current-user-id">Loading...</span></p>
                    </div>

                    <button class="btn btn-secondary" id="switch-account-btn" style="width: 100%;">
                        🔄 Switch Account
                    </button>

                    <button class="btn btn-secondary" id="logout-all-btn" style="width: 100%; margin-top: 0.5rem;">
                        🚪 Logout
                    </button>
                </div>

                <!-- Danger Zone -->
                <div class="settings-section danger-zone">
                    <h3>⚠️ Danger Zone</h3>
                    
                    <button class="btn btn-danger" id="reset-character-btn" style="width: 100%;">
                        Reset Character Data
                    </button>
                    
                    <small class="input-hint">This will reset your level, XP, inventory, and attributes to default values.</small>
                </div>
            </div>
        </div>
    `;

    // Add event listeners
    modal.querySelector('#save-profile-btn').addEventListener('click', saveProfileSettings);
    modal.querySelector('#switch-account-btn').addEventListener('click', switchAccount);
    modal.querySelector('#logout-all-btn').addEventListener('click', handleLogout);
    modal.querySelector('#reset-character-btn').addEventListener('click', resetCharacter);

    return modal;
}

// Load current user settings
async function loadUserSettings() {
    if (!appState.currentUser) return;

    const usernameInput = document.getElementById('settings-username');
    const emailInput = document.getElementById('settings-email');
    const currentEmailSpan = document.getElementById('current-account-email');
    const currentUserIdSpan = document.getElementById('current-user-id');

    // Set email
    if (emailInput) {
        emailInput.value = appState.currentUser.email;
    }

    if (currentEmailSpan) {
        currentEmailSpan.textContent = appState.currentUser.email;
    }

    if (currentUserIdSpan) {
        currentUserIdSpan.textContent = appState.currentUser.uid;
    }

    // Load username from database
    try {
        const userRef = ref(database, `users/${appState.currentUser.uid}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (usernameInput) {
                usernameInput.value = userData.username || '';
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Save profile settings
async function saveProfileSettings() {
    if (!appState.currentUser) return;

    const usernameInput = document.getElementById('settings-username');
    const newUsername = usernameInput.value.trim();

    if (!newUsername) {
        showNotification('Username cannot be empty', 'error');
        return;
    }

    try {
        const userRef = ref(database, `users/${appState.currentUser.uid}`);
        await update(userRef, {
            username: newUsername
        });

        showNotification('Profile updated successfully!', 'success');

        // Update the profile display
        const profileUsername = document.getElementById('profile-username');
        if (profileUsername) {
            profileUsername.textContent = newUsername;
        }

        // Update avatar
        const profileAvatar = document.getElementById('profile-avatar');
        if (profileAvatar) {
            profileAvatar.textContent = newUsername[0].toUpperCase();
        }

    } catch (error) {
        console.error('Error saving profile:', error);
        showNotification('Failed to save profile', 'error');
    }
}

// Switch account (logout and redirect to login)
function switchAccount() {
    if (confirm('Are you sure you want to switch accounts? This will log you out.')) {
        handleLogout();
    }
}

// Handle logout
async function handleLogout() {
    try {
        await signOut(auth);
        showNotification('Logged out successfully', 'success');

        // Close settings modal if open
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.remove();
        }

        navigateTo('login');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Failed to logout', 'error');
    }
}

// Reset character data
async function resetCharacter() {
    if (!appState.currentUser) return;

    const confirmed = confirm(
        '⚠️ WARNING: This will reset ALL your character data including:\n\n' +
        '• Level back to 1\n' +
        '• XP back to 0\n' +
        '• All attributes back to 10\n' +
        '• All inventory items deleted\n' +
        '• Stats reset\n\n' +
        'This action CANNOT be undone!\n\n' +
        'Are you absolutely sure?'
    );

    if (!confirmed) return;

    // Double confirmation
    const doubleConfirm = confirm('Last chance! Reset all character data?');
    if (!doubleConfirm) return;

    try {
        const response = await fetch('http://localhost:5000/api/game/character/initialize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: appState.currentUser.uid
            })
        });

        if (response.ok) {
            showNotification('Character data reset successfully', 'success');

            // Close modal and reload page
            document.getElementById('settings-modal').remove();
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            throw new Error('Reset failed');
        }
    } catch (error) {
        console.error('Error resetting character:', error);
        showNotification('Failed to reset character data', 'error');
    }
}

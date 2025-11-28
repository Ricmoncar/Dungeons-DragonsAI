// Authentication Module
import { auth, database } from './config.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { ref, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { getTranslation } from './language.js';

let isLoginMode = true;

export function initAuth() {
    const authForm = document.getElementById('auth-form');
    const toggleModeBtn = document.getElementById('toggle-mode');
    const submitBtn = document.getElementById('submit-btn');
    const loginTitle = document.getElementById('login-title');
    const toggleText = document.getElementById('toggle-text');
    const usernameGroup = document.getElementById('username-group');

    // Toggle between login and register modes
    toggleModeBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;

        if (isLoginMode) {
            loginTitle.textContent = getTranslation('login-title-login');
            submitBtn.textContent = getTranslation('submit-btn-login');
            toggleText.textContent = getTranslation('toggle-text-login');
            toggleModeBtn.textContent = getTranslation('toggle-btn-signup');
            usernameGroup.classList.add('hidden');
        } else {
            loginTitle.textContent = getTranslation('login-title-signup');
            submitBtn.textContent = getTranslation('submit-btn-signup');
            toggleText.textContent = getTranslation('toggle-text-signup');
            toggleModeBtn.textContent = getTranslation('toggle-btn-login');
            usernameGroup.classList.remove('hidden');
        }

        // Clear error message
        clearError();
    });

    // Handle form submission
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const username = document.getElementById('username').value;

        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.textContent = isLoginMode ? getTranslation('entering') : getTranslation('creating');

        try {
            if (isLoginMode) {
                // Login
                await signInWithEmailAndPassword(auth, email, password);
                console.log('Login successful');
            } else {
                // Register
                if (!username.trim()) {
                    throw new Error('Username is required');
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create user entry in database
                await set(ref(database, 'users/' + user.uid), {
                    username: username.trim(),
                    email: email,
                    level: 1,
                    xp: 0,
                    friends: {}
                });

                console.log('Registration successful');
            }

            // Clear form
            authForm.reset();
        } catch (error) {
            console.error('Auth error:', error);
            showError(getErrorMessage(error));
        } finally {
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? getTranslation('submit-btn-login') : getTranslation('submit-btn-signup');
        }
    });
}

// Display error message
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = `
        <div class="error-message">
            ${message}
        </div>
    `;
}

// Clear error message
function clearError() {
    const errorContainer = document.getElementById('error-container');
    errorContainer.innerHTML = '';
}

// Get user-friendly error message
function getErrorMessage(error) {
    const errorCode = error.code;

    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please login instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        default:
            return error.message || 'An error occurred. Please try again.';
    }
}

// Export sign out function for use in other modules
export async function logout() {
    try {
        await signOut(auth);
        console.log('User signed out');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

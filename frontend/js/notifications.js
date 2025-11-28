/**
 * Notifications Module
 * Toast notifications for rewards, level-ups, and game events
 */

import { getTranslation } from './language.js';

let notificationQueue = [];
let isShowingNotification = false;

export function showNotification(message, type = 'info', duration = 3000) {
    const notification = {
        message,
        type, // 'success', 'error', 'warning', 'info', 'level-up', 'item'
        duration
    };

    notificationQueue.push(notification);
    processQueue();
}

function processQueue() {
    if (isShowingNotification || notificationQueue.length === 0) return;

    isShowingNotification = true;
    const notification = notificationQueue.shift();

    displayNotification(notification);
}

function displayNotification(notification) {
    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${notification.type}`;

    // Add icon based on type
    let icon = '📢';
    if (notification.type === 'success') icon = '✅';
    else if (notification.type === 'error') icon = '❌';
    else if (notification.type === 'warning') icon = '⚠️';
    else if (notification.type === 'level-up') icon = '⬆️';
    else if (notification.type === 'item') icon = '🎁';
    else if (notification.type === 'critical-success') icon = '🌟';
    else if (notification.type === 'critical-fail') icon = '💀';

    toast.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${notification.message}</div>
    `;

    // Get or create container
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }

    container.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
            isShowingNotification = false;
            processQueue(); // Show next notification
        }, 300);
    }, notification.duration);
}

// Special notification for level-up with animation
export function showLevelUpNotification(newLevel) {
    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay';
    overlay.innerHTML = `
        <div class="level-up-content">
            <div class="level-up-animation">
                <div class="level-up-circle"></div>
                <div class="level-up-rays"></div>
            </div>
            <h2 class="level-up-title">${getTranslation('level-up-title')}</h2>
            <div class="level-up-number">${newLevel}</div>
            <p class="level-up-subtitle">${getTranslation('level-up-subtitle')}</p>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => overlay.classList.add('show'), 10);

    // Play level-up sound
    playLevelUpSound();

    // Remove after animation
    setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 500);
    }, 4000);
}

// Special notification for new item
export function showItemNotification(item) {
    const rarityColors = {
        common: '#9ca3af',
        uncommon: '#22c55e',
        rare: '#3b82f6',
        epic: '#a855f7',
        legendary: '#f59e0b'
    };

    const color = rarityColors[item.rarity] || rarityColors.common;

    const overlay = document.createElement('div');
    overlay.className = 'item-notification-overlay';
    overlay.innerHTML = `
        <div class="item-notification-content" style="border-color: ${color}">
            <div class="item-notification-header">
                <span class="item-notification-icon">🎁</span>
                <h3>${getTranslation('new-item-title')}</h3>
            </div>
            <div class="item-notification-body">
                <h2 style="color: ${color}">${item.name}</h2>
                <p>${item.description}</p>
                <div class="item-notification-footer">
                    <span class="item-rarity" style="color: ${color}">${item.rarity.toUpperCase()}</span>
                    <span class="item-type">${item.type}</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    setTimeout(() => overlay.classList.add('show'), 10);

    // Play item sound
    playItemSound();

    // Remove after animation
    setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 500);
    }, 4000);
}

// Play level-up sound
function playLevelUpSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator1 = audioContext.createOscillator();
        const oscillator2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator1.frequency.value = 523.25; // C5
        oscillator2.frequency.value = 659.25; // E5
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator1.start(audioContext.currentTime);
        oscillator2.start(audioContext.currentTime + 0.1);
        oscillator1.stop(audioContext.currentTime + 0.5);
        oscillator2.stop(audioContext.currentTime + 0.6);
    } catch (error) {
        // Silently fail
    }
}

// Play item sound
function playItemSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1000;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        // Silently fail
    }
}

export function initNotifications() {
    // Nothing to initialize for now
}

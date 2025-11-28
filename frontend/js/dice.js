/**
 * Dice Rolling Module
 * Animated dice roller for D&D gameplay
 */

import { appState } from './app.js';
import { showNotification } from './notifications.js';

let rollHistory = [];
let isDiceRollerOpen = false;

export function initDice() {
    createDiceWidget();

    // Listen for dice commands in chat
    window.addEventListener('rollDice', (e) => {
        rollDice(e.detail.type, e.detail.count);
    });
}

// Create floating dice roller widget
function createDiceWidget() {
    const widget = document.createElement('div');
    widget.className = 'dice-widget';
    widget.innerHTML = `
        <button class="dice-toggle-btn" id="dice-toggle">
            🎲
        </button>
        <div class="dice-panel hidden" id="dice-panel">
            <h3>Roll Dice</h3>
            <div class="dice-buttons">
                <button class="dice-btn" data-type="d4">D4</button>
                <button class="dice-btn" data-type="d6">D6</button>
                <button class="dice-btn" data-type="d8">D8</button>
                <button class="dice-btn" data-type="d10">D10</button>
                <button class="dice-btn" data-type="d12">D12</button>
                <button class="dice-btn dice-btn-featured" data-type="d20">D20</button>
                <button class="dice-btn" data-type="d100">D100</button>
            </div>
            <div class="dice-custom">
                <input type="number" id="dice-count" min="1" max="10" value="1" class="dice-count-input" />
                <span>×</span>
                <select id="dice-type-select" class="dice-type-select">
                    <option value="d4">D4</option>
                    <option value="d6">D6</option>
                    <option value="d8">D8</option>
                    <option value="d10">D10</option>
                    <option value="d12">D12</option>
                    <option value="d20" selected>D20</option>
                    <option value="d100">D100</option>
                </select>
                <button class="btn btn-sm btn-primary" id="custom-roll-btn">Roll</button>
            </div>
            <div class="dice-history" id="dice-history">
                <h4>Recent Rolls</h4>
                <div id="dice-history-list"></div>
            </div>
        </div>
    `;

    document.body.appendChild(widget);

    // Toggle panel
    const toggleBtn = document.getElementById('dice-toggle');
    const panel = document.getElementById('dice-panel');

    toggleBtn.addEventListener('click', () => {
        isDiceRollerOpen = !isDiceRollerOpen;
        panel.classList.toggle('hidden');
        toggleBtn.classList.toggle('active');
    });

    // Quick roll buttons
    widget.querySelectorAll('.dice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            rollDice(type, 1);
        });
    });

    // Custom roll
    document.getElementById('custom-roll-btn').addEventListener('click', () => {
        const count = parseInt(document.getElementById('dice-count').value);
        const type = document.getElementById('dice-type-select').value;
        rollDice(type, count);
    });
}

// Roll dice
async function rollDice(type, count = 1) {
    const maxValue = parseInt(type.substring(1));
    const results = [];

    for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * maxValue) + 1);
    }

    const total = results.reduce((sum, val) => sum + val, 0);

    // Create roll object
    const roll = {
        type,
        count,
        results,
        total,
        timestamp: Date.now()
    };

    // Add to history
    rollHistory.unshift(roll);
    if (rollHistory.length > 10) rollHistory.pop();

    // Show animation
    showDiceAnimation(roll);

    // Update history display
    updateHistoryDisplay();

    // Track stat
    if (appState.currentUser) {
        try {
            await fetch('http://localhost:5000/api/game/stats/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: appState.currentUser.uid,
                    statPath: `diceRolls/${type}`,
                    increment: count
                })
            });
        } catch (error) {
            console.error('Error tracking dice roll:', error);
        }
    }

    return roll;
}

// Show dice roll animation
function showDiceAnimation(roll) {
    const overlay = document.createElement('div');
    overlay.className = 'dice-animation-overlay';

    const { type, results, total, count } = roll;

    // Critical hit/fail styling for d20
    let resultClass = '';
    if (type === 'd20') {
        if (results[0] === 20) resultClass = 'critical-success';
        else if (results[0] === 1) resultClass = 'critical-fail';
    }

    overlay.innerHTML = `
        <div class="dice-animation-content ${resultClass}">
            <div class="dice-rolling">
                ${createAnimatedDice(type, count)}
            </div>
            <div class="dice-result">
                <div class="dice-result-main">${total}</div>
                ${count > 1 ? `<div class="dice-result-breakdown">${results.join(' + ')}</div>` : ''}
                <div class="dice-result-type">${count}${type.toUpperCase()}</div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Play sound effect
    playDiceSound();

    // Animate in
    setTimeout(() => overlay.classList.add('show'), 10);

    // Remove after animation
    setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 500);
    }, 2500);

    // Show notification
    let message = `🎲 Rolled ${total}`;
    if (type === 'd20' && results[0] === 20) message = '🌟 NATURAL 20! CRITICAL SUCCESS!';
    else if (type === 'd20' && results[0] === 1) message = '💀 NATURAL 1! CRITICAL FAIL!';

    showNotification(message, resultClass || 'info');
}

// Create animated dice visual
function createAnimatedDice(type, count) {
    let html = '';
    for (let i = 0; i < Math.min(count, 5); i++) {
        const delay = i * 0.1;
        html += `<div class="animated-die ${type}" style="animation-delay: ${delay}s"></div>`;
    }
    if (count > 5) {
        html += `<div class="dice-overflow">+${count - 5}</div>`;
    }
    return html;
}

// Update history display
function updateHistoryDisplay() {
    const historyList = document.getElementById('dice-history-list');
    if (!historyList) return;

    if (rollHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-history">No rolls yet</p>';
        return;
    }

    historyList.innerHTML = rollHistory.map(roll => {
        const timeAgo = getTimeAgo(roll.timestamp);
        return `
            <div class="history-item">
                <span class="history-roll">${roll.count}${roll.type.toUpperCase()}</span>
                <span class="history-result">${roll.total}</span>
                <span class="history-time">${timeAgo}</span>
            </div>
        `;
    }).join('');
}

// Get time ago string
function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

// Play dice sound (simple beep for now)
function playDiceSound() {
    // Create audio context for sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        // Silently fail if audio not supported
    }
}

export { rollDice, rollHistory };

/**
 * Character Module - CAMPAIGN-BASED SYSTEM
 * Each campaign has its own character with independent level, stats, inventory
 */

import { appState } from './app.js';
import { database } from './config.js';
import { ref, set, get, remove, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { showNotification } from './notifications.js';
import { getTranslation } from './language.js';

let currentCampaignId = null;
let characterData = null;

export function initCharacter() {
    // Listen for campaign changes
    window.addEventListener('campaignChanged', async (e) => {
        currentCampaignId = e.detail.campaignId;
        await loadCharacter();
    });

    // Listen for character sheet button
    const checkInterval = setInterval(() => {
        const btn = document.getElementById('open-character-sheet');
        if (btn) {
            btn.addEventListener('click', openCharacterSheet);
            clearInterval(checkInterval);
        }
    }, 100);
}

async function loadCharacter() {
    if (!appState.currentUser || !currentCampaignId) return;

    const characterRef = ref(database, `campaigns/${appState.currentUser.uid}/${currentCampaignId}/character`);
    const snapshot = await get(characterRef);

    if (snapshot.exists()) {
        characterData = snapshot.val();
    } else {
        // Initialize default character for this campaign
        characterData = getDefaultCharacter();
        await set(characterRef, characterData);
    }

    updateProfileDisplay();
    updateHPDisplay();
}

function getDefaultCharacter() {
    const constitution = 10;
    const maxHp = 10 + Math.floor((constitution - 10) / 2); // Base 10 + CON modifier

    return {
        level: 1,
        xp: 0,
        attributePoints: 0,
        attributes: {
            strength: 10,
            dexterity: 10,
            constitution: constitution,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        },
        hp: maxHp,
        maxHp: maxHp,
        inventory: {},
        stats: {
            totalMessages: 0,
            itemsCollected: 0,
            totalXpGained: 0
        }
    };
}

function updateProfileDisplay() {
    if (!characterData) return;

    const levelDisplay = document.getElementById('profile-level');
    const xpDisplay = document.getElementById('profile-xp');
    const xpBarFill = document.getElementById('xp-bar-fill');

    if (levelDisplay) {
        levelDisplay.textContent = `Level ${characterData.level}`;
    }

    const xpNeeded = characterData.level * 100;
    const xpProgress = (characterData.xp / xpNeeded) * 100;

    if (xpDisplay) {
        xpDisplay.textContent = `Experience: ${characterData.xp} / ${xpNeeded}`;
    }

    if (xpBarFill) {
        xpBarFill.style.width = `${Math.min(xpProgress, 100)}%`;
    }
}

function openCharacterSheet() {
    if (!characterData) {
        showNotification('Character data not loaded', 'error');
        return;
    }

    recalculateMaxHp(); // Ensure stats are fresh before display

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'character-modal';

    const inventory = characterData.inventory || {};
    const inventoryItems = Object.entries(inventory);

    modal.innerHTML = `
        <div class="modal-content character-sheet-content">
            <div class="modal-header">
                <h2>⚔️ ${getTranslation('char-sheet-title')}</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>

            <div class="character-body">
                <!-- Character Info Section -->
                ${characterData.name ? `
                <div class="character-section">
                    <h3>${getTranslation('char-info-title')}</h3>
                    <div class="character-info-grid">
                        <div class="info-item">
                            <span class="info-label">${getTranslation('name-label')}</span>
                            <span class="info-value">${characterData.name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${getTranslation('race-label')}</span>
                            <span class="info-value">${characterData.race || 'Unknown'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${getTranslation('class-label')}</span>
                            <span class="info-value">${characterData.class || 'Unknown'}</span>
                        </div>
                        ${characterData.appearance ? `
                        <div class="info-item" style="grid-column: 1 / -1;">
                            <span class="info-label">${getTranslation('appearance-label')}</span>
                            <p class="info-description">${characterData.appearance}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Stats Section -->
                <div class="character-section">
                    <h3>${getTranslation('char-stats-title')}</h3>
                    <div class="character-stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">${getTranslation('level-label')}</span>
                            <span class="stat-value">${characterData.level}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">${getTranslation('xp-label')}</span>
                            <span class="stat-value">${characterData.xp}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">${getTranslation('hp-label')}</span>
                            <span class="stat-value hp-value">${characterData.hp || characterData.maxHp || 10} / ${characterData.maxHp || 10}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">${getTranslation('points-label')}</span>
                            <span class="stat-value">${characterData.attributePoints}</span>
                        </div>
                    </div>
                </div>

                <!-- Attributes Section -->
                <div class="character-section">
                    <h3>${getTranslation('attributes-title')} ${characterData.attributePoints > 0 ? `<span class="points-badge">${characterData.attributePoints} ${getTranslation('points-available-badge')}</span>` : ''}</h3>
                    <div class="attributes-grid">
                        ${createAttributeItems()}
                    </div>
                </div>

                <!-- Inventory Section -->
                <div class="character-section">
                    <h3>${getTranslation('inventory-title-modal')} <span class="item-count">(${inventoryItems.length} ${getTranslation('items-count')})</span></h3>
                    <div class="inventory-grid">
                        ${inventoryItems.length > 0 ? inventoryItems.map(([id, item]) => createInventoryItem(id, item)).join('') : `<p class="empty-inventory">${getTranslation('empty-inventory-modal')}</p>`}
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    // Add attribute point allocation listeners
    modal.querySelectorAll('.attribute-plus').forEach(btn => {
        btn.addEventListener('click', () => allocatePoint(btn.dataset.attribute));
    });

    // Add item deletion listeners
    modal.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteItem(btn.dataset.itemId));
    });
}

function createAttributeItems() {
    const attrs = characterData.attributes;
    const attrNames = {
        strength: getTranslation('attr-str'),
        dexterity: getTranslation('attr-dex'),
        constitution: getTranslation('attr-con'),
        intelligence: getTranslation('attr-int'),
        wisdom: getTranslation('attr-wis'),
        charisma: getTranslation('attr-cha')
    };

    return Object.entries(attrs).map(([key, value]) => {
        const modifier = Math.floor((value - 10) / 2);
        const modifierText = modifier >= 0 ? `+${modifier}` : `${modifier}`;

        return `
            <div class="attribute-item">
                <div class="attribute-name">${attrNames[key]}</div>
                <div class="attribute-value">${value}</div>
                <div class="attribute-modifier">${modifierText}</div>
                ${characterData.attributePoints > 0 ? `<button class="attribute-plus" data-attribute="${key}">+</button>` : ''}
            </div>
        `;
    }).join('');
}

function createInventoryItem(id, item) {
    const rarityColors = {
        common: '#9ca3af',
        uncommon: '#22c55e',
        rare: '#3b82f6',
        epic: '#a855f7',
        legendary: '#f59e0b'
    };

    const color = rarityColors[item.rarity] || rarityColors.common;

    return `
        <div class="inventory-item" style="border-color: ${color}">
            <div class="item-header">
                <h4>${item.name}</h4>
                <button class="delete-item-btn" data-item-id="${id}">🗑️</button>
            </div>
            <p class="item-description">${item.description}</p>
            <div class="item-meta">
                <span class="item-rarity" style="color: ${color}">${item.rarity}</span>
                <span class="item-type">${item.type}</span>
            </div>
        </div>
    `;
}

async function allocatePoint(attribute) {
    if (!characterData || characterData.attributePoints <= 0) return;

    characterData.attributes[attribute]++;
    characterData.attributePoints--;

    recalculateMaxHp(); // Recalculate immediately after stat change

    await saveCharacter();

    // Refresh modal
    document.getElementById('character-modal').remove();
    openCharacterSheet();

    showNotification(`${attribute.toUpperCase()} ${getTranslation('attribute-increased')}`, 'success');
}

async function deleteItem(itemId) {
    if (!confirm(getTranslation('delete-item-confirm'))) return;

    delete characterData.inventory[itemId];
    await saveCharacter();

    document.getElementById('character-modal').remove();
    openCharacterSheet();

    showNotification(getTranslation('item-deleted'), 'success');
}

async function saveCharacter() {
    if (!appState.currentUser || !currentCampaignId) return;

    const characterRef = ref(database, `campaigns/${appState.currentUser.uid}/${currentCampaignId}/character`);
    await set(characterRef, characterData);

    updateProfileDisplay();
}

// Export for use by other modules
export async function addXP(amount) {
    if (!characterData) return;

    characterData.xp += amount;
    characterData.stats.totalXpGained += amount;

    // Check for level up
    const xpNeeded = characterData.level * 100;
    let levelsGained = 0;

    while (characterData.xp >= xpNeeded) {
        characterData.xp -= xpNeeded;
        characterData.level++;
        characterData.attributePoints++;
        levelsGained++;
    }

    if (levelsGained > 0) {
        recalculateMaxHp(); // Recalculate on level up
    }

    await saveCharacter();

    if (levelsGained > 0) {
        return { leveled: true, newLevel: characterData.level };
    }

    return { leveled: false };
}

export async function addItem(item) {
    if (!characterData) return;

    // Initialize inventory if it doesn't exist
    if (!characterData.inventory) {
        characterData.inventory = {};
    }

    const itemId = Date.now().toString();
    characterData.inventory[itemId] = {
        ...item,
        acquiredAt: Date.now()
    };

    if (!characterData.stats) {
        characterData.stats = {
            totalMessages: 0,
            itemsCollected: 0,
            totalXpGained: 0
        };
    }

    characterData.stats.itemsCollected++;

    await saveCharacter();
}

export async function takeDamage(amount) {
    console.log(`Taking damage: ${amount} `);

    // Ensure character data is loaded
    if (!characterData && currentCampaignId && appState.currentUser) {
        await loadCharacter();
    }

    if (!characterData) {
        console.error('Character data not found for takeDamage');
        return;
    }

    recalculateMaxHp();

    const oldHp = characterData.hp;
    characterData.hp = Math.max(0, characterData.hp - amount);
    console.log(`HP updated: ${oldHp} -> ${characterData.hp} `);

    await saveCharacter();
    updateHPDisplay();

    if (characterData.hp === 0) {
        showNotification(getTranslation('defeated-msg'), 'error');
    }
}

export async function heal(amount) {
    console.log(`Healing: ${amount} `);

    // Ensure character data is loaded
    if (!characterData && currentCampaignId && appState.currentUser) {
        await loadCharacter();
    }

    if (!characterData) {
        console.error('Character data not found for heal');
        return;
    }

    recalculateMaxHp();

    const oldHp = characterData.hp;
    characterData.hp = Math.min(characterData.maxHp, characterData.hp + amount);
    console.log(`HP updated: ${oldHp} -> ${characterData.hp} `);

    await saveCharacter();
    updateHPDisplay();
}

function recalculateMaxHp() {
    if (!characterData) return;

    // Ensure attributes exist
    if (!characterData.attributes) {
        characterData.attributes = {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };
    }

    const con = parseInt(characterData.attributes.constitution) || 10;
    const conModifier = Math.floor((con - 10) / 2);
    const level = parseInt(characterData.level) || 1;

    // Formula: 10 + CON mod + (level-1) * (5 + CON mod)
    // Base 10 + CON modifier for level 1
    // + (5 + CON modifier) for each level after 1 (average of d10)
    const newMaxHp = 10 + conModifier + ((level - 1) * (5 + conModifier));

    // Ensure MaxHP is at least 1
    const finalMaxHp = Math.max(1, newMaxHp);

    if (characterData.maxHp !== finalMaxHp) {
        // Only log if it's a change, not initial calculation
        if (characterData.maxHp !== undefined) {
            console.log(`Recalculating MaxHP: ${characterData.maxHp} -> ${finalMaxHp} (CON: ${con}, Level: ${level})`);
        }
        characterData.maxHp = finalMaxHp;

        // Adjust current HP if it exceeds new MaxHP
        if (characterData.hp > characterData.maxHp) {
            characterData.hp = characterData.maxHp;
        }
    }

    // Ensure HP is defined
    if (characterData.hp === undefined) {
        characterData.hp = characterData.maxHp;
    }
}

function updateHPDisplay() {
    const hpBar = document.getElementById('hp-bar-fill');
    const hpText = document.getElementById('hp-text');

    if (hpBar && characterData) {
        // Ensure MaxHP is up to date before displaying
        recalculateMaxHp();

        const hp = characterData.hp;
        const maxHp = characterData.maxHp;
        const percentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));

        hpBar.style.width = `${percentage}% `;

        // Color based on HP percentage
        if (percentage > 66) {
            hpBar.style.background = '#10b981';
        } else if (percentage > 33) {
            hpBar.style.background = '#f59e0b';
        } else {
            hpBar.style.background = '#ef4444';
        }
    }

    if (hpText && characterData) {
        const hp = characterData.hp;
        const maxHp = characterData.maxHp;
        hpText.textContent = `${hp} / ${maxHp} HP`;
    }
}

export { characterData, updateHPDisplay, recalculateMaxHp };

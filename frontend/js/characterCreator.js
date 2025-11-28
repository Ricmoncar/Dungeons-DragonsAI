/**
 * Campaign Creator Module
 * Character creation and story context generation
 */

import { appState } from './app.js';
import { database } from './config.js';
import { ref, set, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { showNotification } from './notifications.js';
import { getCurrentLanguage } from './language.js';

export async function createCampaignWithContext(campaignId, campaignName) {
    return new Promise((resolve) => {
        showCharacterCreator(campaignId, campaignName, resolve);
    });
}

function showCharacterCreator(campaignId, campaignName, onComplete) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay character-creator-overlay';
    modal.id = 'character-creator';

    modal.innerHTML = `
        <div class="modal-content character-creator-content">
            <div class="modal-header">
                <h2>🧙 Create Your Character</h2>
                <p class="creator-subtitle">Campaign: ${campaignName}</p>
            </div>

            <div class="creator-body">
                <div class="creator-section">
                    <h3>📖 Choose Your Story</h3>
                    <div id="story-contexts" class="story-contexts">
                        <div class="loading-contexts">Generating story ideas...</div>
                    </div>
                    <button class="btn btn-secondary" id="refresh-contexts" style="width: 100%; margin-top: 1rem;">
                        🔄 Generate New Ideas
                    </button>
                </div>

                <div class="creator-section">
                    <h3>⚔️ Character Details</h3>
                    <div class="input-group">
                        <label class="input-label">Name</label>
                        <input type="text" id="char-name" class="input-field" placeholder="Character name" />
                    </div>
                    <div class="input-group">
                        <label class="input-label">Race</label>
                        <select id="char-race" class="input-field">
                            <option value="Human">Human</option>
                            <option value="Elf">Elf</option>
                            <option value="Dwarf">Dwarf</option>
                            <option value="Halfling">Halfling</option>
                            <option value="Dragonborn">Dragonborn</option>
                            <option value="Tiefling">Tiefling</option>
                            <option value="Half-Orc">Half-Orc</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Class</label>
                        <select id="char-class" class="input-field">
                            <option value="Fighter">Fighter</option>
                            <option value="Wizard">Wizard</option>
                            <option value="Rogue">Rogue</option>
                            <option value="Cleric">Cleric</option>
                            <option value="Ranger">Ranger</option>
                            <option value="Paladin">Paladin</option>
                            <option value="Barbarian">Barbarian</option>
                            <option value="Bard">Bard</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="input-label">Appearance</label>
                        <textarea id="char-appearance" class="input-field" rows="3" placeholder="Describe appearance..."></textarea>
                    </div>
                </div>

                <div class="creator-section">
                    <h3>📊 Attributes</h3>
                    <p class="stats-info">Distribute 27 points (min: 8, max: 15)</p>
                    <div id="stat-allocation" class="stat-allocation"></div>
                    <div class="points-remaining">Points: <span id="points-remaining">27</span></div>
                </div>

                <button class="btn btn-primary" id="create-character-btn" style="width: 100%; margin-top: 2rem;">
                    ✨ Begin Adventure
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    initStatAllocation();
    generateStoryContexts();

    document.getElementById('refresh-contexts').addEventListener('click', generateStoryContexts);

    document.getElementById('create-character-btn').addEventListener('click', async () => {
        const characterData = getCharacterData();
        if (!characterData.name) {
            showNotification('Please enter name', 'error');
            return;
        }

        const selectedContext = document.querySelector('.story-context.selected');
        if (!selectedContext) {
            showNotification('Please select a story', 'error');
            return;
        }

        const context = selectedContext.dataset.context;

        await saveCharacterToCampaign(campaignId, characterData, context);
        await addStoryContextMessage(campaignId, context);

        modal.remove();
        onComplete();

        showNotification('Character created!', 'success');
    });
}

async function addStoryContextMessage(campaignId, context) {
    const messageRef = ref(database, `chats/${appState.currentUser.uid}/${campaignId}`);

    await push(messageRef, {
        role: 'assistant',
        content: `📖 **Your Story Begins:**\n\n${context}\n\nWhat do you do?`,
        timestamp: Date.now(),
        aiProvider: 'story'
    });
}

function initStatAllocation() {
    const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const statsContainer = document.getElementById('stat-allocation');
    const statValues = {};

    stats.forEach(stat => {
        statValues[stat] = 8;
    });

    let pointsLeft = 27;

    function render() {
        statsContainer.innerHTML = stats.map(stat => `
            <div class="stat-row">
                <span class="stat-name">${stat.toUpperCase().slice(0, 3)}</span>
                <button class="stat-btn minus" data-stat="${stat}">−</button>
                <span class="stat-value">${statValues[stat]}</span>
                <button class="stat-btn plus" data-stat="${stat}">+</button>
                <span class="stat-modifier">${Math.floor((statValues[stat] - 10) / 2) >= 0 ? '+' : ''}${Math.floor((statValues[stat] - 10) / 2)}</span>
            </div>
        `).join('');

        document.getElementById('points-remaining').textContent = pointsLeft;

        statsContainer.querySelectorAll('.plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const stat = btn.dataset.stat;
                if (statValues[stat] < 15 && pointsLeft > 0) {
                    statValues[stat]++;
                    pointsLeft--;
                    render();
                }
            });
        });

        statsContainer.querySelectorAll('.minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const stat = btn.dataset.stat;
                if (statValues[stat] > 8) {
                    statValues[stat]--;
                    pointsLeft++;
                    render();
                }
            });
        });
    }

    render();
    window.statValues = statValues;
}

async function generateStoryContexts() {
    const container = document.getElementById('story-contexts');
    container.innerHTML = '<div class="loading-contexts">🎲 Generating...</div>';

    const currentLang = getCurrentLanguage();
    const prompt = currentLang === 'es'
        ? 'Genera 3 escenarios únicos para una campaña de D&D. 2-3 frases cada uno. Formato: 1. [escenario] 2. [escenario] 3. [escenario]'
        : 'Generate 3 unique D&D campaign scenarios. 2-3 sentences each. Format: 1. [scenario] 2. [scenario] 3. [scenario]';

    try {
        const response = await fetch('http://localhost:5000/api/chat/deepseek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: prompt,
                context: [],
                language: currentLang
            })
        });

        const data = await response.json();
        const text = data.choices[0].message.content;
        const scenarios = text.split(/\d+\./).filter(s => s.trim()).slice(0, 3);

        container.innerHTML = scenarios.map((scenario, i) => `
            <div class="story-context" data-context="${scenario.trim()}">
                <h4>Story ${i + 1}</h4>
                <p>${scenario.trim()}</p>
            </div>
        `).join('');

        container.querySelectorAll('.story-context').forEach(ctx => {
            ctx.addEventListener('click', () => {
                container.querySelectorAll('.story-context').forEach(c => c.classList.remove('selected'));
                ctx.classList.add('selected');
            });
        });

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div class="story-context selected" data-context="You are an adventurer seeking fortune. Your journey begins in a tavern.">
                <h4>Default Story</h4>
                <p>You are an adventurer seeking fortune. Your journey begins in a tavern.</p>
            </div>
        `;
    }
}

function getCharacterData() {
    return {
        name: document.getElementById('char-name').value.trim(),
        race: document.getElementById('char-race').value,
        class: document.getElementById('char-class').value,
        appearance: document.getElementById('char-appearance').value.trim(),
        attributes: window.statValues || {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        }
    };
}

async function saveCharacterToCampaign(campaignId, characterData, context) {
    const characterRef = ref(database, `campaigns/${appState.currentUser.uid}/${campaignId}/character`);

    await set(characterRef, {
        ...characterData,
        level: 1,
        xp: 0,
        attributePoints: 0,
        inventory: {},
        stats: {
            totalMessages: 0,
            itemsCollected: 0,
            totalXpGained: 0
        },
        storyContext: context,
        createdAt: Date.now()
    });
}

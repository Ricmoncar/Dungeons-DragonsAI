/**
 * Chat Module - WITH DUAL AI SELECTION
 */
import { appState } from './app.js';
import { database } from './config.js';
import { ref, push, onValue, get, set } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { showNotification } from './notifications.js';
import { getCurrentLanguage, getTranslation } from './language.js';

let messages = [];
let messagesContainer;
let chatInput;
let sendBtn;
let typingIndicator;
let currentCampaignId = null;
let messagesListener = null;

export function initChat() {
    messagesContainer = document.getElementById('chat-messages');
    chatInput = document.getElementById('chat-input');
    sendBtn = document.getElementById('send-btn');
    typingIndicator = document.getElementById('typing-indicator');

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
    }

    window.addEventListener('campaignChanged', (e) => {
        currentCampaignId = e.detail.campaignId;
        if (appState.currentUser) {
            loadMessages(appState.currentUser.uid, currentCampaignId);
        }
    });
}

function loadMessages(userId, campaignId) {
    if (!campaignId) return;

    if (messagesListener) {
        messagesListener();
    }

    const messagesRef = ref(database, `chats/${userId}/${campaignId}`);

    messagesListener = onValue(messagesRef, (snapshot) => {
        const data = snapshot.val();

        if (data) {
            messages = Object.entries(data).map(([key, value]) => ({
                id: key,
                ...value
            }));
            renderMessages();

            updateCampaignMessageCount(campaignId, messages.length);
        } else {
            messages = [];
            renderMessages();
        }
    });
}

async function updateCampaignMessageCount(campaignId, count) {
    const countRef = ref(database, `campaigns/${appState.currentUser.uid}/${campaignId}/messageCount`);
    await set(countRef, count);
}

async function handleSendMessage() {
    const messageText = chatInput.value.trim();

    if (!messageText || !appState.currentUser) return;

    if (!currentCampaignId) {
        showNotification(getTranslation('campaign-select-error'), 'error');
        return;
    }

    const userMessage = {
        role: 'user',
        content: messageText,
        timestamp: Date.now()
    };

    chatInput.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = getTranslation('sending');

    try {
        await push(ref(database, `chats/${appState.currentUser.uid}/${currentCampaignId}`), userMessage);

        const characterRef = ref(database, `campaigns/${appState.currentUser.uid}/${currentCampaignId}/character`);
        const characterSnapshot = await get(characterRef);
        const characterData = characterSnapshot.val() || {};

        showTypingIndicator(getTranslation('typing-indicator'));

        // Call backend for dual response
        const response = await fetch('http://localhost:5000/api/chat/dual-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: messageText,
                context: messages.map(m => ({ role: m.role, content: m.content })),
                character: characterData,
                language: getCurrentLanguage() // Send current language
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get AI responses');
        }

        const data = await response.json();
        hideTypingIndicator();

        showDualResponseSelection(data.responses);

    } catch (error) {
        console.error('Error sending message:', error);

        const errorMessage = {
            role: 'assistant',
            content: '⚠️ Failed to get responses. Error: ' + error.message,
            timestamp: Date.now()
        };

        await push(ref(database, `chats/${appState.currentUser.uid}/${currentCampaignId}`), errorMessage);
        hideTypingIndicator();
        showNotification('Failed to get AI responses: ' + error.message, 'error');
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = getTranslation('send-btn');
    }
}

function showDualResponseSelection(responses) {
    const overlay = document.createElement('div');
    overlay.className = 'dual-response-overlay';
    overlay.id = 'dual-response-overlay';

    const deepseek = responses.deepseek;
    const groq = responses.groq;

    overlay.innerHTML = `
        <div class="dual-response-container">
            <h2 class="dual-response-title">🎭 Choose Your Response</h2>
            <p class="dual-response-subtitle">Both AIs have responded. Select the one you prefer!</p>
            
            <div class="dual-response-cards">
                ${createResponseCard(deepseek, 'deepseek')}
                ${createResponseCard(groq, 'groq')}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);

    overlay.querySelectorAll('.response-choice-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const provider = e.target.dataset.provider;
            const selectedResponse = provider === 'deepseek' ? deepseek : groq;
            await selectResponse(selectedResponse, provider);
            overlay.remove();
        });
    });
}

function createResponseCard(response, provider) {
    const providerName = provider === 'deepseek' ? '🤖 Deepseek' : '🦙 Groq';
    const providerColor = provider === 'deepseek' ? 'deepseek' : 'groq';

    if (!response.success) {
        return `
            <div class="response-card response-error">
                <div class="response-header">
                    <span class="response-provider ${providerColor}">${providerName}</span>
                    <span class="response-status error">❌ Unavailable</span>
                </div>
                <div class="response-body">
                    <p>${response.content}</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="response-card">
            <div class="response-header">
                <span class="response-provider ${providerColor}">${providerName}</span>
                <span class="response-status">✅ Ready</span>
            </div>
            <div class="response-body">
                <p class="response-text">${response.content}</p>
            </div>
            <button class="btn btn-primary response-choice-btn" data-provider="${provider}">
                Choose This Response
            </button>
        </div>
    `;
}

async function selectResponse(response, provider) {
    try {
        const commands = parseCommands(response.content);

        const aiMessage = {
            role: 'assistant',
            content: commands.cleanText,
            timestamp: Date.now(),
            aiProvider: provider
        };

        await push(ref(database, `chats/${appState.currentUser.uid}/${currentCampaignId}`), aiMessage);

        if (commands.commands.length > 0) {
            await executeCommands(commands.commands);
        }

        showNotification(`Response from ${provider} selected!`, 'success');

    } catch (error) {
        console.error('Error selecting response:', error);
        showNotification('Failed to save response', 'error');
    }
}

function parseCommands(text) {
    const commands = [];
    let cleanText = text;

    const xpMatches = text.match(/\[GIVE_XP\s+(\d+)\]/gi);
    if (xpMatches) {
        xpMatches.forEach(match => {
            const amount = parseInt(match.match(/\d+/)[0]);
            commands.push({ type: 'GIVE_XP', amount });
            cleanText = cleanText.replace(match, '').trim();
        });
    }

    const itemMatches = text.match(/\[GIVE_ITEM\s+([^\]]+)\]/gi);
    if (itemMatches) {
        itemMatches.forEach(match => {
            const content = match.match(/\[GIVE_ITEM\s+([^\]]+)\]/)[1];
            const parts = content.split('|').map(p => p?.trim());

            // Handle incomplete formats with smart defaults
            const name = parts[0] || 'Mystery Item';
            const description = parts[1] || 'A mysterious item you found';
            const rarity = parts[2] || 'common';
            const itemType = parts[3] || 'misc';

            commands.push({
                type: 'GIVE_ITEM',
                name: name,
                description: description,
                rarity: rarity,
                itemType: itemType
            });
            cleanText = cleanText.replace(match, '').trim();
        });
    }

    const rollMatches = text.match(/\[ROLL\s+([^\]]+)\]/gi);
    if (rollMatches) {
        rollMatches.forEach(match => {
            const dice = match.match(/\[ROLL\s+([^\]]+)\]/)[1].trim();
            commands.push({ type: 'ROLL', dice });
            cleanText = cleanText.replace(match, '').trim();
        });
    }

    // Parse DAMAGE - flexible regex to catch [DAMAGE 5], [DAMAGE: 5], [DAMAGE:5], etc.
    const damageMatches = text.match(/\[DAMAGE\s*:?\s*(\d+)[^\]]*\]/gi);
    if (damageMatches) {
        console.log('Found DAMAGE matches:', damageMatches);
        damageMatches.forEach(match => {
            const amountMatch = match.match(/\d+/);
            if (amountMatch) {
                const amount = parseInt(amountMatch[0]);
                commands.push({ type: 'DAMAGE', amount });
                cleanText = cleanText.replace(match, '').trim();
            }
        });
    }

    // Parse HEAL
    const healMatches = text.match(/\[HEAL\s*:?\s*(\d+)[^\]]*\]/gi);
    if (healMatches) {
        console.log('Found HEAL matches:', healMatches);
        healMatches.forEach(match => {
            const amountMatch = match.match(/\d+/);
            if (amountMatch) {
                const amount = parseInt(amountMatch[0]);
                commands.push({ type: 'HEAL', amount });
                cleanText = cleanText.replace(match, '').trim();
            }
        });
    }

    return { cleanText, commands };
}

async function executeCommands(commands) {
    for (const cmd of commands) {
        if (cmd.type === 'GIVE_XP') {
            const { addXP } = await import('./character.js');
            const result = await addXP(cmd.amount);

            showNotification(`+${cmd.amount} XP!`, 'success');

            if (result.leveled) {
                showNotification(`🎉 Level Up! You are now level ${result.newLevel}!`, 'success');
            }
        } else if (cmd.type === 'GIVE_ITEM') {
            const { addItem } = await import('./character.js');
            await addItem({
                name: cmd.name,
                description: cmd.description,
                rarity: cmd.rarity,
                type: cmd.itemType
            });

            showNotification(`📦 Received: ${cmd.name}`, 'success');
        } else if (cmd.type === 'ROLL') {
            showNotification(`🎲 Roll ${cmd.dice}!`, 'info');
        } else if (cmd.type === 'DAMAGE') {
            const { takeDamage } = await import('./character.js');
            await takeDamage(cmd.amount);
            showNotification(`💔 Took ${cmd.amount} damage!`, 'error');
        } else if (cmd.type === 'HEAL') {
            const { heal } = await import('./character.js');
            await heal(cmd.amount);
            showNotification(`💚 Healed ${cmd.amount} HP!`, 'success');
        }
    }
}

function renderMessages() {
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';

    messages.forEach((msg) => {
        const messageEl = createMessageElement(msg);
        messagesContainer.appendChild(messageEl);
    });

    scrollToBottom();
}

function createMessageElement(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${msg.role}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    if (msg.aiProvider) {
        const badge = document.createElement('span');
        badge.className = 'ai-provider-badge';
        badge.textContent = msg.aiProvider === 'deepseek' ? '🤖 Deepseek' : '🦙 Groq';
        bubbleDiv.appendChild(badge);
    }

    const content = document.createElement('div');
    content.textContent = msg.content;
    bubbleDiv.appendChild(content);

    messageDiv.appendChild(bubbleDiv);
    return messageDiv;
}

function showTypingIndicator(text = 'AI is thinking...') {
    if (typingIndicator) {
        typingIndicator.querySelector('span').textContent = text;
        typingIndicator.classList.remove('hidden');
        scrollToBottom();
    }
}

function hideTypingIndicator() {
    if (typingIndicator) {
        typingIndicator.classList.add('hidden');
    }
}

function scrollToBottom() {
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

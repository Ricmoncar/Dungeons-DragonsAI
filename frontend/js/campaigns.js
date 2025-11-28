/**
 * Campaign Management Module - FIXED
 * Fixes: Chat persistence between users, duplicate campaign creation
 */

import { appState } from './app.js';
import { database } from './config.js';
import { ref, push, set, remove, onValue, get, off } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
import { showNotification } from './notifications.js';
import { createCampaignWithContext } from './characterCreator.js';

let campaigns = [];
let currentCampaignId = null;
let campaignsRef = null;
let isCreatingDefault = false;

export function initCampaigns() {
    const checkAuth = setInterval(() => {
        if (appState.currentUser) {
            resetCampaignState();
            loadCampaigns();
            setupCampaignUI();
            clearInterval(checkAuth);
        }
    }, 100);
}

// Reset state when user changes
function resetCampaignState() {
    campaigns = [];
    currentCampaignId = null;
    isCreatingDefault = false;

    // Unsubscribe from previous user's campaigns
    if (campaignsRef) {
        off(campaignsRef);
    }
}

function loadCampaigns() {
    campaignsRef = ref(database, `campaigns/${appState.currentUser.uid}`);

    onValue(campaignsRef, (snapshot) => {
        const data = snapshot.val();

        if (data) {
            campaigns = Object.entries(data).map(([id, campaign]) => ({
                id,
                name: campaign.name || 'Untitled Campaign',
                ...campaign
            }));
        } else {
            campaigns = [];
        }

        updateCampaignList();

        // Only create default if no campaigns AND not already creating
        if (campaigns.length === 0 && !isCreatingDefault) {
            isCreatingDefault = true;
            createDefaultCampaign();
        } else if (campaigns.length > 0 && !currentCampaignId) {
            selectCampaign(campaigns[0].id);
        }
    });
}

async function updateMessageCount(campaignId) {
    const messagesRef = ref(database, `chats/${appState.currentUser.uid}/${campaignId}`);
    const snapshot = await get(messagesRef);
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    await set(ref(database, `campaigns/${appState.currentUser.uid}/${campaignId}/messageCount`), count);
}

function setupCampaignUI() {
    const chatContainer = document.querySelector('.chat-container');
    if (!chatContainer) return;

    // Remove existing header if any
    const existingHeader = chatContainer.querySelector('.campaign-header');
    if (existingHeader) existingHeader.remove();

    const campaignHeader = document.createElement('div');
    campaignHeader.className = 'campaign-header';
    campaignHeader.innerHTML = `
        <button class="btn btn-secondary" id="open-campaigns">
            📚 Campaigns
        </button>
        <span id="current-campaign-name">Loading...</span>
    `;

    chatContainer.insertBefore(campaignHeader, chatContainer.firstChild);
    document.getElementById('open-campaigns').addEventListener('click', openCampaignModal);
}

function openCampaignModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'campaigns-modal';

    modal.innerHTML = `
        <div class="modal-content campaigns-content">
            <div class="modal-header">
                <h2>📚 Your Campaigns</h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>

            <div class="campaigns-body">
                <button class="btn btn-primary" id="create-campaign-btn" style="width: 100%; margin-bottom: 1rem;">
                    ➕ New Campaign
                </button>

                <div class="campaigns-list" id="campaigns-list">
                    <!-- Campaigns will be inserted here -->
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    modal.querySelector('#create-campaign-btn').addEventListener('click', () => {
        modal.remove();
        promptCreateCampaign();
    });

    updateCampaignList();
}

function updateCampaignList() {
    const listContainer = document.getElementById('campaigns-list');
    if (!listContainer) return;

    if (campaigns.length === 0) {
        listContainer.innerHTML = '<p class="empty-campaigns">No campaigns yet. Create your first adventure!</p>';
        return;
    }

    listContainer.innerHTML = campaigns.map(campaign => {
        const isActive = campaign.id === currentCampaignId;
        const messageCount = campaign.messageCount || 0;

        return `
            <div class="campaign-item ${isActive ? 'active' : ''}" data-id="${campaign.id}">
                <div class="campaign-info">
                    <h4>${campaign.name}</h4>
                    <p class="campaign-meta">
                        <span>📝 ${messageCount} messages</span>
                        <span>🕐 ${formatDate(campaign.createdAt)}</span>
                    </p>
                </div>
                <div class="campaign-actions">
                    ${!isActive ? `<button class="btn btn-sm btn-primary select-campaign-btn" data-id="${campaign.id}">Select</button>` : '<span class="active-badge">Active</span>'}
                    <button class="btn btn-sm btn-secondary delete-campaign-btn" data-id="${campaign.id}">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    listContainer.querySelectorAll('.select-campaign-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectCampaign(btn.dataset.id);
            document.getElementById('campaigns-modal').remove();
        });
    });

    listContainer.querySelectorAll('.delete-campaign-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteCampaign(btn.dataset.id));
    });

    const currentCampaign = campaigns.find(c => c.id === currentCampaignId);
    const nameDisplay = document.getElementById('current-campaign-name');
    if (nameDisplay && currentCampaign) {
        nameDisplay.textContent = currentCampaign.name;
    }
}

async function createDefaultCampaign() {
    // Create default campaign but treat it as a new one to trigger character creator
    await createCampaign('The Beginning', false);
}

function promptCreateCampaign() {
    const name = prompt('Enter campaign name:');
    if (!name || !name.trim()) {
        showNotification('Campaign name cannot be empty', 'error');
        return;
    }
    createCampaign(name.trim());
}

async function createCampaign(name, isDefault = false) {
    if (!appState.currentUser) return;

    try {
        const campaignsRef = ref(database, `campaigns/${appState.currentUser.uid}`);
        const newCampaignRef = push(campaignsRef);

        await set(newCampaignRef, {
            name,
            createdAt: Date.now(),
            messageCount: 0
        });

        if (!isDefault) {
            showNotification(`Campaign "${name}" created!`, 'success');

            // Show character creator for new campaigns
            await createCampaignWithContext(newCampaignRef.key, name);
        }

        selectCampaign(newCampaignRef.key);

    } catch (error) {
        console.error('Error creating campaign:', error);
        showNotification('Failed to create campaign', 'error');
    }
}

function selectCampaign(campaignId) {
    currentCampaignId = campaignId;

    const event = new CustomEvent('campaignChanged', { detail: { campaignId } });
    window.dispatchEvent(event);

    updateCampaignList();
}

async function deleteCampaign(campaignId) {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    const confirmed = confirm(`Delete campaign "${campaign.name}"?\n\nThis will permanently delete all messages in this campaign. This cannot be undone!`);
    if (!confirmed) return;

    try {
        await remove(ref(database, `campaigns/${appState.currentUser.uid}/${campaignId}`));
        await remove(ref(database, `chats/${appState.currentUser.uid}/${campaignId}`));

        showNotification(`Campaign "${campaign.name}" deleted`, 'success');

        if (campaignId === currentCampaignId) {
            const remaining = campaigns.filter(c => c.id !== campaignId);
            if (remaining.length > 0) {
                selectCampaign(remaining[0].id);
            } else {
                isCreatingDefault = false;
                createDefaultCampaign();
            }
        }

    } catch (error) {
        console.error('Error deleting campaign:', error);
        showNotification('Failed to delete campaign', 'error');
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
}

export { currentCampaignId, campaigns };

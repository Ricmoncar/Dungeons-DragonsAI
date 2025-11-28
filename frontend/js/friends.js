// Friend System Module
import { appState } from './app.js';
import { database } from './config.js';
import { ref, update } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

let searchForm;
let searchInput;
let searchResults;

export function initFriends() {
    searchForm = document.getElementById('search-form');
    searchInput = document.getElementById('search-input');
    searchResults = document.getElementById('search-results');

    // Handle search form submission
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSearch();
    });
}

// Handle user search
async function handleSearch() {
    const query = searchInput.value.trim();

    if (!query) {
        return;
    }

    // Show loading state
    searchResults.innerHTML = '<div class="loading-text">Searching for adventurers...</div>';

    try {
        const response = await fetch(`http://localhost:5000/api/users/search?query=${encodeURIComponent(query)}`);

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const users = await response.json();
        renderSearchResults(users);

    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="loading-text">Failed to search. Please check your backend connection.</div>';
    }
}

// Render search results
function renderSearchResults(users) {
    if (!users || Object.keys(users).length === 0) {
        searchResults.innerHTML = '<div class="loading-text">No users found</div>';
        return;
    }

    searchResults.innerHTML = '';

    Object.entries(users).forEach(([uid, user]) => {
        // Don't show current user in results
        if (uid === appState.currentUser?.uid) {
            return;
        }

        const friendItem = document.createElement('div');
        friendItem.className = 'friend-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'friend-name';
        nameSpan.textContent = user.username || user.email;

        const addBtn = document.createElement('button');
        addBtn.className = 'btn btn-add-friend';
        addBtn.textContent = 'Add Friend';
        addBtn.onclick = () => handleAddFriend(uid, user.username);

        friendItem.appendChild(nameSpan);
        friendItem.appendChild(addBtn);
        searchResults.appendChild(friendItem);
    });
}

// Handle adding a friend
async function handleAddFriend(friendId, friendUsername) {
    if (!appState.currentUser) {
        alert('You must be logged in to add friends');
        return;
    }

    try {
        const updates = {};
        updates[`users/${appState.currentUser.uid}/friends/${friendId}`] = true;
        updates[`users/${friendId}/friends/${appState.currentUser.uid}`] = true;

        await update(ref(database), updates);

        alert(`${friendUsername} has been added as a friend!`);

        // Optionally refresh search results
        await handleSearch();

    } catch (error) {
        console.error('Error adding friend:', error);
        alert('Failed to add friend. Please try again.');
    }
}

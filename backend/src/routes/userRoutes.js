const express = require('express');
const { db } = require('../config/firebase');
const router = express.Router();

// Search users by name
router.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query required' });

    try {
        // This is a simple search, might need indexing in Firebase
        const usersRef = db.ref('users');
        const snapshot = await usersRef.orderByChild('username').startAt(query).endAt(query + "\uf8ff").once('value');
        const users = snapshot.val();
        res.json(users || {});
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Add friend (placeholder logic, usually handled by updating DB directly or via transaction)
router.post('/add-friend', async (req, res) => {
    const { userId, friendId } = req.body;
    try {
        await db.ref(`users/${userId}/friends/${friendId}`).set(true);
        await db.ref(`users/${friendId}/friends/${userId}`).set(true);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add friend' });
    }
});

module.exports = router;

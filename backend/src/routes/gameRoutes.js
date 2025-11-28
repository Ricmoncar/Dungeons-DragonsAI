/**
 * Game Routes
 * API endpoints for game mechanics
 */

const express = require('express');
const router = express.Router();
const gameService = require('../services/gameService');

// Get character data
router.get('/character/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await gameService.getCharacter(userId);
        if (result.success) {
            res.json(result.character);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Error getting character:', error);
        res.status(500).json({ error: 'Failed to get character' });
    }
});

// Initialize character for new user
router.post('/character/initialize', async (req, res) => {
    const { userId } = req.body;

    try {
        const result = await gameService.initializeCharacter(userId);
        if (result.success) {
            res.json(result.characterData);
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Error initializing character:', error);
        res.status(500).json({ error: 'Failed to initialize character' });
    }
});

// Add item to inventory
router.post('/inventory/add', async (req, res) => {
    const { userId, item } = req.body;

    try {
        const result = await gameService.addItemToInventory(userId, item);
        res.json(result);
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Remove item from inventory
router.delete('/inventory/:userId/:itemId', async (req, res) => {
    const { userId, itemId } = req.params;

    try {
        const result = await gameService.removeItemFromInventory(userId, itemId);
        res.json(result);
    } catch (error) {
        console.error('Error removing item:', error);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// Add experience points
router.post('/stats/add-xp', async (req, res) => {
    const { userId, amount } = req.body;

    try {
        const result = await gameService.addExperience(userId, amount);
        res.json(result);
    } catch (error) {
        console.error('Error adding XP:', error);
        res.status(500).json({ error: 'Failed to add XP' });
    }
});

// Allocate attribute point
router.post('/stats/allocate', async (req, res) => {
    const { userId, attribute } = req.body;

    try {
        const result = await gameService.allocateAttributePoint(userId, attribute);
        res.json(result);
    } catch (error) {
        console.error('Error allocating attribute:', error);
        res.status(500).json({ error: 'Failed to allocate attribute' });
    }
});

// Execute game commands
router.post('/execute-commands', async (req, res) => {
    const { userId, commands } = req.body;

    try {
        const results = await gameService.executeCommands(userId, commands);
        res.json({ success: true, results });
    } catch (error) {
        console.error('Error executing commands:', error);
        res.status(500).json({ error: 'Failed to execute commands' });
    }
});

// Track statistic
router.post('/stats/track', async (req, res) => {
    const { userId, statPath, increment } = req.body;

    try {
        const result = await gameService.trackStat(userId, statPath, increment);
        res.json(result);
    } catch (error) {
        console.error('Error tracking stat:', error);
        res.status(500).json({ error: 'Failed to track stat' });
    }
});

module.exports = router;

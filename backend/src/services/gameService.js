/**
 * Game Service
 * Handles all game mechanics logic (inventory, stats, XP, attributes)
 */

const { db } = require('../config/firebase');

// Add item to user's inventory
async function addItemToInventory(userId, item) {
    try {
        const itemId = generateItemId();
        const itemData = {
            id: itemId,
            name: item.name,
            description: item.description,
            type: item.type || 'quest',
            rarity: item.rarity || 'common',
            acquiredAt: Date.now()
        };

        await db.ref(`users/${userId}/inventory/${itemId}`).set(itemData);
        return { success: true, item: itemData };
    } catch (error) {
        console.error('Error adding item:', error);
        return { success: false, error: error.message };
    }
}

// Remove item from inventory
async function removeItemFromInventory(userId, itemId) {
    try {
        await db.ref(`users/${userId}/inventory/${itemId}`).remove();
        return { success: true };
    } catch (error) {
        console.error('Error removing item:', error);
        return { success: false, error: error.message };
    }
}

// Add experience points and handle level-up
async function addExperience(userId, xpAmount) {
    try {
        const userRef = db.ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        let currentXp = userData.xp || 0;
        let currentLevel = userData.level || 1;
        let attributePoints = userData.attributePoints || 0;

        currentXp += xpAmount;

        // Calculate XP needed for next level (100 * level)
        let xpForNextLevel = currentLevel * 100;
        let levelsGained = 0;

        // Check for level-ups
        while (currentXp >= xpForNextLevel) {
            currentXp -= xpForNextLevel;
            currentLevel++;
            levelsGained++;
            xpForNextLevel = currentLevel * 100;
            attributePoints++; // Grant 1 attribute point per level
        }

        // Update user data
        await userRef.update({
            xp: currentXp,
            level: currentLevel,
            attributePoints: attributePoints
        });

        // Track stats
        await trackStat(userId, 'totalXpGained', xpAmount);

        return {
            success: true,
            levelsGained,
            newLevel: currentLevel,
            currentXp,
            xpForNextLevel,
            attributePoints
        };
    } catch (error) {
        console.error('Error adding XP:', error);
        return { success: false, error: error.message };
    }
}

// Allocate attribute point
async function allocateAttributePoint(userId, attribute) {
    try {
        const validAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        if (!validAttributes.includes(attribute)) {
            return { success: false, error: 'Invalid attribute' };
        }

        const userRef = db.ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        const attributePoints = userData.attributePoints || 0;
        if (attributePoints <= 0) {
            return { success: false, error: 'No attribute points available' };
        }

        const currentValue = userData.attributes?.[attribute] || 10;

        await userRef.update({
            [`attributes/${attribute}`]: currentValue + 1,
            attributePoints: attributePoints - 1
        });

        return { success: true, newValue: currentValue + 1, remainingPoints: attributePoints - 1 };
    } catch (error) {
        console.error('Error allocating attribute:', error);
        return { success: false, error: error.message };
    }
}

// Add attribute points directly (from AI command)
async function addAttributePoints(userId, attribute, amount) {
    try {
        const validAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
        if (!validAttributes.includes(attribute)) {
            return { success: false, error: 'Invalid attribute' };
        }

        const userRef = db.ref(`users/${userId}`);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();

        const currentValue = userData.attributes?.[attribute] || 10;

        await userRef.update({
            [`attributes/${attribute}`]: currentValue + amount
        });

        return { success: true, newValue: currentValue + amount };
    } catch (error) {
        console.error('Error adding attribute points:', error);
        return { success: false, error: error.message };
    }
}

// Calculate D&D attribute modifier
function calculateAttributeModifier(value) {
    return Math.floor((value - 10) / 2);
}

// Initialize character for new user
async function initializeCharacter(userId) {
    try {
        const characterData = {
            attributes: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            },
            attributePoints: 5, // Starting points
            inventory: {},
            stats: {
                totalMessages: 0,
                diceRolls: {
                    d4: 0, d6: 0, d8: 0, d10: 0, d12: 0, d20: 0, d100: 0
                },
                itemsCollected: 0,
                totalXpGained: 0,
                achievements: []
            }
        };

        await db.ref(`users/${userId}`).update(characterData);
        return { success: true, characterData };
    } catch (error) {
        console.error('Error initializing character:', error);
        return { success: false, error: error.message };
    }
}

// Get character data
async function getCharacter(userId) {
    try {
        const snapshot = await db.ref(`users/${userId}`).once('value');
        const userData = snapshot.val();

        return {
            success: true,
            character: userData
        };
    } catch (error) {
        console.error('Error getting character:', error);
        return { success: false, error: error.message };
    }
}

// Track statistics
async function trackStat(userId, statPath, increment = 1) {
    try {
        const statRef = db.ref(`users/${userId}/stats/${statPath}`);
        const snapshot = await statRef.once('value');
        const currentValue = snapshot.val() || 0;
        await statRef.set(currentValue + increment);
        return { success: true };
    } catch (error) {
        console.error('Error tracking stat:', error);
        return { success: false, error: error.message };
    }
}

// Execute parsed commands
async function executeCommands(userId, commands) {
    const results = [];

    for (const command of commands) {
        let result;

        switch (command.type) {
            case 'GIVE_ITEM':
                result = await addItemToInventory(userId, command.data);
                if (result.success) {
                    await trackStat(userId, 'itemsCollected', 1);
                }
                break;

            case 'GIVE_XP':
                result = await addExperience(userId, command.data.amount);
                break;

            case 'GIVE_STAT':
                result = await addAttributePoints(userId, command.data.attribute, command.data.amount);
                break;

            default:
                result = { success: false, error: 'Unknown command type' };
        }

        results.push({
            command: command.type,
            ...result
        });
    }

    return results;
}

// Generate unique item ID
function generateItemId() {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
    addItemToInventory,
    removeItemFromInventory,
    addExperience,
    allocateAttributePoint,
    addAttributePoints,
    calculateAttributeModifier,
    initializeCharacter,
    getCharacter,
    trackStat,
    executeCommands
};

/**
 * Chat Routes - WITH DUAL AI
 */

const express = require('express');
const axios = require('axios');
const router = express.Router();

// DUAL AI ENDPOINT - Returns both responses
router.post('/dual-response', async (req, res) => {
    const { message, context, character, language } = req.body;

    try {
        // Build system prompt with character info
        let systemPrompt = 'You are a Dungeon Master for a D&D adventure. Be creative, engaging, and respond to the player\'s actions with vivid descriptions. Keep responses under 200 words.';

        // Language enforcement
        const targetLang = language === 'es' ? 'Spanish' : 'English';
        systemPrompt += `\n\nIMPORTANT: You MUST respond in ${targetLang}.`;

        if (character && character.name) {
            systemPrompt += `\n\nCHARACTER INFO:\n`;
            systemPrompt += `Name: ${character.name}\n`;
            systemPrompt += `Race: ${character.race || 'Unknown'}\n`;
            systemPrompt += `Class: ${character.class || 'Unknown'}\n`;
            systemPrompt += `Level: ${character.level || 1}\n`;
            if (character.attributes) {
                systemPrompt += `Stats: STR ${character.attributes.strength}, DEX ${character.attributes.dexterity}, CON ${character.attributes.constitution}, INT ${character.attributes.intelligence}, WIS ${character.attributes.wisdom}, CHA ${character.attributes.charisma}\n`;
            }
            systemPrompt += `\n**IMPORTANT GAME COMMANDS:**\nYou MUST use these commands when appropriate:\n\n`;
            systemPrompt += `[GIVE_XP 50] - Give 50 XP (use after successful actions, combat victories, quest completion)\n`;
            systemPrompt += `[GIVE_ITEM Magic Sword|A gleaming blade with ancient runes|rare|weapon] - Give items (format: name|description|rarity|type)\n`;
            systemPrompt += `[DAMAGE 10] - Deal 10 damage to player (use in combat, traps, falling)\n`;
            systemPrompt += `[HEAL 5] - Heal player 5 HP (use for potions, rest, healing spells)\n`;
            systemPrompt += `[ROLL d20] - Request dice rolls (use for skill checks, attacks, saves)\n\n`;
            systemPrompt += `Rarity options: common, uncommon, rare, epic, legendary\n`;
            systemPrompt += `Type options: weapon, armor, consumable, misc\n\n`;
            systemPrompt += `Player HP: ${character.hp || character.maxHp || 10}/${character.maxHp || 10}\n\n`;
            systemPrompt += `EXAMPLE: "The goblin attacks! [DAMAGE 5] [ROLL d20] to dodge!"\n`;
            systemPrompt += `EXAMPLE: "You drink the potion. [HEAL 10] You feel restored!"\n\n`;
            systemPrompt += `Use these commands NATURALLY in your narrative. Reward good roleplay!`;
        }

        const messages = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];

        if (context && Array.isArray(context) && context.length > 0) {
            messages.push(...context.slice(-5));
        }

        messages.push({
            role: 'user',
            content: message
        });

        // Call both APIs in parallel
        const [deepseekResult, groqResult] = await Promise.allSettled([
            callDeepseek(messages),
            callGroq(messages)
        ]);

        res.json({
            success: true,
            responses: {
                deepseek: processResponse(deepseekResult, 'deepseek'),
                groq: processResponse(groqResult, 'groq')
            }
        });

    } catch (error) {
        console.error('Dual response error:', error);
        res.status(500).json({ error: 'Failed to get dual responses' });
    }
});

// Single Deepseek endpoint (backup)
router.post('/deepseek', async (req, res) => {
    const { message, context, language } = req.body;

    try {
        let systemPrompt = 'You are a Dungeon Master for a D&D adventure.';

        // Language enforcement
        const targetLang = language === 'es' ? 'Spanish' : 'English';
        systemPrompt += `\n\nIMPORTANT: You MUST respond in ${targetLang}.`;

        const messages = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];

        if (context && Array.isArray(context)) {
            messages.push(...context.slice(-5));
        }

        messages.push({
            role: 'user',
            content: message
        });

        const response = await callDeepseek(messages);
        res.json(response);

    } catch (error) {
        console.error('Deepseek error:', error);
        res.status(500).json({ error: 'Failed to get Deepseek response' });
    }
});

// Helper functions
async function callDeepseek(messages) {
    const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
            model: 'deepseek-chat',
            messages: messages,
            temperature: 0.7,
            max_tokens: 300
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    );
    return response.data;
}

async function callGroq(messages) {
    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: 'llama-3.1-8b-instant',
            messages: messages,
            temperature: 0.7,
            max_tokens: 300
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        }
    );
    return response.data;
}

function processResponse(settledResult, provider) {
    if (settledResult.status === 'fulfilled') {
        const data = settledResult.value;
        const content = data.choices?.[0]?.message?.content || 'No response generated';

        return {
            success: true,
            content: content,
            provider: provider,
            model: data.model
        };
    } else {
        return {
            success: false,
            error: settledResult.reason?.message || 'API call failed',
            provider: provider,
            content: `${provider} is currently unavailable. Please try again.`
        };
    }
}

module.exports = router;

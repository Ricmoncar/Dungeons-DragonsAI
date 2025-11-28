/**
 * Command Parser Service
 * Parses AI responses for embedded game commands and extracts clean text
 */

// Parse AI response for game commands
function parseCommands(aiResponse) {
    const commands = [];
    let cleanText = aiResponse;

    // Command patterns
    const patterns = {
        GIVE_ITEM: /\[GIVE_ITEM:([^:]+):([^\]]+)\]/g,
        GIVE_XP: /\[GIVE_XP:(\d+)\]/g,
        GIVE_STAT: /\[GIVE_STAT:(STR|DEX|CON|INT|WIS|CHA):(\d+)\]/g,
        ROLL_DICE: /\[ROLL_DICE:(d\d+):(\d+)\]/g,
        SET_THEME: /\[SET_THEME:(combat|exploration|danger|victory)\]/g
    };

    // Extract GIVE_ITEM commands
    let match;
    while ((match = patterns.GIVE_ITEM.exec(aiResponse)) !== null) {
        commands.push({
            type: 'GIVE_ITEM',
            data: {
                name: match[1].trim(),
                description: match[2].trim()
            }
        });
        cleanText = cleanText.replace(match[0], '');
    }

    // Extract GIVE_XP commands
    patterns.GIVE_XP.lastIndex = 0;
    while ((match = patterns.GIVE_XP.exec(aiResponse)) !== null) {
        commands.push({
            type: 'GIVE_XP',
            data: {
                amount: parseInt(match[1])
            }
        });
        cleanText = cleanText.replace(match[0], '');
    }

    // Extract GIVE_STAT commands
    patterns.GIVE_STAT.lastIndex = 0;
    while ((match = patterns.GIVE_STAT.exec(aiResponse)) !== null) {
        commands.push({
            type: 'GIVE_STAT',
            data: {
                attribute: match[1].toLowerCase(),
                amount: parseInt(match[2])
            }
        });
        cleanText = cleanText.replace(match[0], '');
    }

    // Extract ROLL_DICE commands
    patterns.ROLL_DICE.lastIndex = 0;
    while ((match = patterns.ROLL_DICE.exec(aiResponse)) !== null) {
        commands.push({
            type: 'ROLL_DICE',
            data: {
                diceType: match[1],
                count: parseInt(match[2])
            }
        });
        cleanText = cleanText.replace(match[0], '');
    }

    // Extract SET_THEME commands
    patterns.SET_THEME.lastIndex = 0;
    while ((match = patterns.SET_THEME.exec(aiResponse)) !== null) {
        commands.push({
            type: 'SET_THEME',
            data: {
                theme: match[1]
            }
        });
        cleanText = cleanText.replace(match[0], '');
    }

    // Auto-detect theme from text content
    const autoTheme = detectThemeFromText(cleanText);
    if (autoTheme && !commands.some(cmd => cmd.type === 'SET_THEME')) {
        commands.push({
            type: 'SET_THEME',
            data: { theme: autoTheme }
        });
    }

    // Clean up extra whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();

    return {
        cleanText,
        commands
    };
}

// Auto-detect theme from text content
function detectThemeFromText(text) {
    const lowerText = text.toLowerCase();

    // Combat keywords
    const combatKeywords = ['attack', 'combat', 'battle', 'fight', 'sword', 'damage', 'hit', 'strike', 'ataque', 'combate', 'batalla', 'lucha', 'daño', 'golpe'];
    if (combatKeywords.some(keyword => lowerText.includes(keyword))) {
        return 'combat';
    }

    // Danger keywords
    const dangerKeywords = ['danger', 'trap', 'poison', 'death', 'deadly', 'curse', 'peligro', 'trampa', 'veneno', 'muerte', 'mortal', 'maldición'];
    if (dangerKeywords.some(keyword => lowerText.includes(keyword))) {
        return 'danger';
    }

    // Victory keywords
    const victoryKeywords = ['victory', 'win', 'triumph', 'success', 'defeat', 'victorious', 'victoria', 'triunfo', 'éxito', 'derrotas'];
    if (victoryKeywords.some(keyword => lowerText.includes(keyword))) {
        return 'victory';
    }

    // Default to exploration
    return 'exploration';
}

module.exports = {
    parseCommands,
    detectThemeFromText
};

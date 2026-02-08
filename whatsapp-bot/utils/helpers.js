const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment-timezone");

// Load configuration
function loadConfig() {
    const configPath = path.join(__dirname, "..", "config.json");
    if (!fs.existsSync(configPath)) {
        const defaultConfig = {
            botName: "Advanced WhatsApp Bot",
            prefix: ".",
            timezone: "Asia/Jakarta",
            owner: "",
            downloaderAPI: "",
            nsfwEnabled: false,
            gameTimeout: 30,
            cooldownTime: 5,
            ownerRegistered: false
        };
        fs.writeJsonSync(configPath, defaultConfig, { spaces: 2 });
        return defaultConfig;
    }
    return fs.readJsonSync(configPath);
}

// Save configuration
function saveConfig(config) {
    const configPath = path.join(__dirname, "..", "config.json");
    fs.writeJsonSync(configPath, config, { spaces: 2 });
}

// Load database
function loadDB(dbName) {
    const dbPath = path.join(__dirname, "..", "database", `${dbName}.json`);
    if (!fs.existsSync(dbPath)) {
        const defaultDB = dbName === "leaderboard" || dbName === "cooldown" 
            ? { users: {} } 
            : { sessions: {} };
        fs.writeJsonSync(dbPath, defaultDB, { spaces: 2 });
        return defaultDB;
    }
    return fs.readJsonSync(dbPath);
}

// Save database
function saveDB(dbName, data) {
    const dbPath = path.join(__dirname, "..", "database", `${dbName}.json`);
    fs.writeJsonSync(dbPath, data, { spaces: 2 });
}

// Check if user is owner
function isOwner(userJid, config) {
    if (!config.owner) return false;
    const userNumber = userJid.split("@")[0];
    return userNumber === config.owner;
}

// Check if user is group admin
async function isAdmin(sock, groupJid, userJid) {
    try {
        const groupMetadata = await sock.groupMetadata(groupJid);
        const participant = groupMetadata.participants.find(p => p.id === userJid);
        return participant && (participant.admin === "admin" || participant.admin === "superadmin");
    } catch (error) {
        return false;
    }
}

// Check if bot is group admin
async function isBotAdmin(sock, groupJid) {
    try {
        const groupMetadata = await sock.groupMetadata(groupJid);
        const botJid = sock.user.id.split(':')[0] + "@s.whatsapp.net";
        const participant = groupMetadata.participants.find(p => p.id === botJid);
        return participant && (participant.admin === "admin" || participant.admin === "superadmin");
    } catch (error) {
        console.error("Error checking bot admin:", error);
        return false;
    }
}

// Cooldown system
function checkCooldown(userJid, config) {
    const cooldownDB = loadDB("cooldown");
    const now = Date.now();
    const userNumber = userJid.split("@")[0];

    if (cooldownDB.users[userNumber]) {
        const lastUsed = cooldownDB.users[userNumber];
        const timePassed = (now - lastUsed) / 1000;

        if (timePassed < config.cooldownTime) {
            return {
                onCooldown: true,
                remaining: Math.ceil(config.cooldownTime - timePassed)
            };
        }
    }

    // Update cooldown
    cooldownDB.users[userNumber] = now;
    saveDB("cooldown", cooldownDB);

    return { onCooldown: false };
}

// Format time
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// Get current time
function getTime(timezone = "Asia/Jakarta") {
    return moment.tz(timezone).format("HH:mm:ss");
}

// Get current date
function getDate(timezone = "Asia/Jakarta") {
    return moment.tz(timezone).format("DD/MM/YYYY");
}

// Load banner config
function loadBanner() {
    const config = loadConfig();
    return config.banner || {
        title: "🌸 Aphrodite Bot 🌸",
        subtitle: "by Franza",
        description: "Halo! Aku adalah bot multifungsi untuk membantu kamu di grup.",
        disclaimer: "⚠️ Educational Purpose Only",
        image: null,
        enabled: true
    };
}

// Save banner config
function saveBanner(bannerData) {
    const config = loadConfig();
    config.banner = bannerData;
    saveConfig(config);
}

// Format banner text
function formatBanner(banner) {
    let text = "";
    if (banner.title) text += `${banner.title}\n`;
    if (banner.subtitle) text += `${banner.subtitle}\n\n`;
    if (banner.description) text += `${banner.description}\n\n`;
    if (banner.disclaimer) text += `${banner.disclaimer}\n`;
    return text;
}

// Random element from array
function random(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Generate random code
function generateCode(length = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Log with color
function log(message, type = "info") {
    const time = getTime();
    const types = {
        info: chalk.cyan,
        success: chalk.green,
        warn: chalk.yellow,
        error: chalk.red
    };
    const color = types[type] || chalk.white;
    console.log(color(`[${time}] ${message}`));
}

// Extract mentions from message
function getMentions(message) {
    const mentions = [];
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        mentions.push(...message.message.extendedTextMessage.contextInfo.mentionedJid);
    }
    return mentions;
}

// Clean phone number
function cleanNumber(number) {
    return number.replace(/[^0-9]/g, "");
}

// Format number to JID
function toJid(number) {
    const clean = cleanNumber(number);
    return clean + "@s.whatsapp.net";
}

module.exports = {
    loadConfig,
    saveConfig,
    loadDB,
    saveDB,
    isOwner,
    isAdmin,
    isBotAdmin,
    checkCooldown,
    formatTime,
    getTime,
    getDate,
    random,
    generateCode,
    log,
    getMentions,
    cleanNumber,
    toJid,
    loadBanner,
    saveBanner,
    formatBanner
};

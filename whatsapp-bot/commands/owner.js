const { loadConfig, saveConfig, isOwner, log } = require("../utils/helpers");
const fs = require("fs-extra");
const path = require("path");

async function handleOwnerCommands(sock, msg, body, from) {
    const config = loadConfig();
    const sender = msg.key.remoteJid;
    const senderNumber = sender.split("@")[0];

    // Registration with code
    if (body.startsWith(".code ")) {
        const code = body.replace(".code ", "").trim();
        const authCodePath = path.join(__dirname, "..", "auth-code.txt");

        // Check if owner already registered
        if (config.ownerRegistered) {
            await sock.sendMessage(from, {
                text: "❌ *Owner sudah terdaftar!*\n\nFitur registrasi hanya bisa digunakan 1x."
            }, { quoted: msg });
            return;
        }

        // Check if auth code file exists
        if (!fs.existsSync(authCodePath)) {
            await sock.sendMessage(from, {
                text: "❌ *Auth code tidak ditemukan!*\n\nFile auth-code.txt belum dibuat."
            }, { quoted: msg });
            return;
        }

        // Read and verify code
        const validCode = fs.readFileSync(authCodePath, "utf-8").trim();
        
        if (code === validCode) {
            config.owner = senderNumber;
            config.ownerRegistered = true;
            saveConfig(config);

            log(`Owner registered: ${senderNumber}`, "success");

            await sock.sendMessage(from, {
                text: `✅ *Registrasi Berhasil!*\n\n` +
                      `Nomor: ${senderNumber}\n` +
                      `Status: Owner Bot\n\n` +
                      `Kamu sekarang memiliki akses penuh ke semua fitur owner!`
            }, { quoted: msg });

            // Delete auth code file for security
            fs.unlinkSync(authCodePath);
        } else {
            await sock.sendMessage(from, {
                text: "❌ *Kode salah!*\n\nPastikan kamu memasukkan kode yang benar dari file auth-code.txt"
            }, { quoted: msg });
        }
        return;
    }

    // Check if user is owner for commands below
    if (!isOwner(sender, config)) return;

    // Set downloader API
    if (body.startsWith(".apidownload ")) {
        const apiUrl = body.replace(".apidownload ", "").trim();

        if (!apiUrl.startsWith("http")) {
            await sock.sendMessage(from, {
                text: "❌ *URL tidak valid!*\n\nGunakan format: .apidownload https://api.example.com"
            }, { quoted: msg });
            return;
        }

        config.downloaderAPI = apiUrl;
        saveConfig(config);

        log(`Downloader API updated: ${apiUrl}`, "success");

        await sock.sendMessage(from, {
            text: `✅ *API Downloader berhasil diset!*\n\n` +
                  `URL: ${apiUrl}\n\n` +
                  `Sekarang kamu bisa menggunakan semua fitur downloader.`
        }, { quoted: msg });
        return;
    }

    // Set game timeout
    if (body.startsWith(".settimeout ")) {
        const timeout = parseInt(body.replace(".settimeout ", "").trim());

        if (isNaN(timeout) || timeout < 10 || timeout > 300) {
            await sock.sendMessage(from, {
                text: "❌ *Timeout tidak valid!*\n\nGunakan angka antara 10-300 detik.\nContoh: .settimeout 30"
            }, { quoted: msg });
            return;
        }

        config.gameTimeout = timeout;
        saveConfig(config);

        log(`Game timeout updated: ${timeout}s`, "success");

        await sock.sendMessage(from, {
            text: `✅ *Timeout game berhasil diset!*\n\nDurasi: ${timeout} detik`
        }, { quoted: msg });
        return;
    }

    // Toggle NSFW
    if (body === ".nsfwtoggle") {
        config.nsfwEnabled = !config.nsfwEnabled;
        saveConfig(config);

        const status = config.nsfwEnabled ? "AKTIF ✅" : "NONAKTIF ❌";
        
        log(`NSFW toggled: ${config.nsfwEnabled}`, "warn");

        await sock.sendMessage(from, {
            text: `🔞 *NSFW Mode: ${status}*\n\n` +
                  (config.nsfwEnabled 
                      ? "Semua command NSFW sekarang dapat digunakan di semua grup." 
                      : "Semua command NSFW telah dinonaktifkan.")
        }, { quoted: msg });
        return;
    }

    // Show config
    if (body === ".config") {
        const configText = `⚙️ *BOT CONFIGURATION*\n\n` +
            `📱 Bot Name: ${config.botName}\n` +
            `🔑 Prefix: ${config.prefix}\n` +
            `🌍 Timezone: ${config.timezone}\n` +
            `👑 Owner: ${config.owner || "Not registered"}\n` +
            `🔗 Downloader API: ${config.downloaderAPI || "Not set"}\n` +
            `🔞 NSFW: ${config.nsfwEnabled ? "Enabled" : "Disabled"}\n` +
            `⏱️ Game Timeout: ${config.gameTimeout}s\n` +
            `⏳ Cooldown: ${config.cooldownTime}s`;

        await sock.sendMessage(from, {
            text: configText
        }, { quoted: msg });
        return;
    }
}

module.exports = { handleOwnerCommands };

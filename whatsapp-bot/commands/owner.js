const { loadConfig, saveConfig, isOwner, log, loadBanner, saveBanner, formatBanner } = require("../utils/helpers");
const fs = require("fs-extra");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

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
    if (body.startsWith(".setnsfw ")) {
        const action = body.replace(".setnsfw ", "").toLowerCase().trim();
        
        if (action !== "on" && action !== "off") {
            await sock.sendMessage(from, {
                text: "❌ *Parameter tidak valid!*\n\nGunakan: .setnsfw on atau .setnsfw off"
            }, { quoted: msg });
            return;
        }
        
        config.nsfwEnabled = (action === "on");
        saveConfig(config);

        const status = config.nsfwEnabled ? "AKTIF ✅" : "NONAKTIF ❌";
        
        log(`NSFW set to: ${action}`, "warn");

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
            `⏳ Cooldown: ${config.cooldownTime}s\n\n` +
            `🎨 Banner: ${config.banner?.enabled ? "Custom" : "Default"}`;

        await sock.sendMessage(from, {
            text: configText
        }, { quoted: msg });
        return;
    }

    // Set banner title
    if (body.startsWith(".setbanner ")) {
        const title = body.replace(".setbanner ", "").trim();
        const banner = loadBanner();
        banner.title = title;
        saveBanner(banner);

        await sock.sendMessage(from, {
            text: `✅ *Banner title diupdate!*\n\n${title}`
        }, { quoted: msg });
        log(`Banner title updated: ${title}`, "success");
        return;
    }

    // Set banner subtitle
    if (body.startsWith(".setsubtitle ")) {
        const subtitle = body.replace(".setsubtitle ", "").trim();
        const banner = loadBanner();
        banner.subtitle = subtitle;
        saveBanner(banner);

        await sock.sendMessage(from, {
            text: `✅ *Banner subtitle diupdate!*\n\n${subtitle}`
        }, { quoted: msg });
        log(`Banner subtitle updated: ${subtitle}`, "success");
        return;
    }

    // Set banner description
    if (body.startsWith(".setdesc ")) {
        const desc = body.replace(".setdesc ", "").trim();
        const banner = loadBanner();
        banner.description = desc;
        saveBanner(banner);

        await sock.sendMessage(from, {
            text: `✅ *Banner description diupdate!*\n\n${desc}`
        }, { quoted: msg });
        log(`Banner description updated`, "success");
        return;
    }

    // Set banner image
    if (body === ".setbannerimg") {
        if (!msg.message.imageMessage && !msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
            await sock.sendMessage(from, {
                text: "❌ *Reply ke gambar!*\n\nKirim gambar lalu reply dengan .setbannerimg"
            }, { quoted: msg });
            return;
        }

        try {
            const buffer = await downloadMediaMessage(
                msg,
                "buffer",
                {},
                { logger: require("pino")(), reuploadRequest: sock.updateMediaMessage }
            );

            const base64 = buffer.toString("base64");
            const banner = loadBanner();
            banner.image = base64;
            saveBanner(banner);

            await sock.sendMessage(from, {
                text: `✅ *Banner image berhasil diset!*\n\nGambar akan muncul di menu.`
            }, { quoted: msg });

            log(`Banner image updated`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal set banner image!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Remove banner image
    if (body === ".removebannerimg") {
        const banner = loadBanner();
        banner.image = null;
        saveBanner(banner);

        await sock.sendMessage(from, {
            text: `✅ *Banner image dihapus!*`
        }, { quoted: msg });
        log(`Banner image removed`, "success");
        return;
    }

    // Preview banner
    if (body === ".previewbanner") {
        const banner = loadBanner();
        const bannerText = formatBanner(banner);

        if (banner.image) {
            const imageBuffer = Buffer.from(banner.image, "base64");
            await sock.sendMessage(from, {
                image: imageBuffer,
                caption: bannerText
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, {
                text: `📋 *BANNER PREVIEW*\n\n${bannerText}`
            }, { quoted: msg });
        }
        return;
    }

    // Reset banner
    if (body === ".resetbanner") {
        const defaultBanner = {
            title: "🌸 Aphrodite Bot 🌸",
            subtitle: "by Franza",
            description: "Halo! Aku adalah bot multifungsi untuk membantu kamu di grup.",
            disclaimer: "⚠️ Educational Purpose Only",
            image: null,
            enabled: true
        };
        saveBanner(defaultBanner);

        await sock.sendMessage(from, {
            text: `✅ *Banner direset ke default!*\n\n${formatBanner(defaultBanner)}`
        }, { quoted: msg });
        log(`Banner reset to default`, "success");
        return;
    }
}

module.exports = { handleOwnerCommands };

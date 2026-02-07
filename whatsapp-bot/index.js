const { default: makeWASocket, useMultiFileAuthState, downloadMediaMessage, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const chalk = require("chalk");
const qrcode = require("qrcode-terminal");
const { loadConfig, saveConfig, checkCooldown, generateCode, log } = require("./utils/helpers");
const { handleOwnerCommands } = require("./commands/owner");
const { handleAdminCommands } = require("./commands/admin");
const { handleDownloaderCommands } = require("./commands/downloader");
const { handleGameCommands } = require("./commands/games");
const { handleNSFWCommands } = require("./commands/nsfw");

// Generate auth code on first run
function initAuthCode() {
    const authCodePath = path.join(__dirname, "auth-code.txt");
    
    if (!fs.existsSync(authCodePath)) {
        const code = generateCode(16);
        fs.writeFileSync(authCodePath, code);
        console.log(chalk.green("\n========================================"));
        console.log(chalk.yellow("  🔐 OWNER REGISTRATION CODE"));
        console.log(chalk.green("========================================"));
        console.log(chalk.cyan(`  Code: ${chalk.bold(code)}`));
        console.log(chalk.green("========================================"));
        console.log(chalk.yellow("  Gunakan command: .code <kode>"));
        console.log(chalk.yellow("  untuk registrasi sebagai owner!"));
        console.log(chalk.green("========================================\n"));
    }
}

async function startBot() {
    // Initialize
    initAuthCode();
    const config = loadConfig();

    console.log(chalk.cyan("\n========================================"));
    console.log(chalk.green(`  🤖 ${config.botName}`));
    console.log(chalk.cyan("========================================"));
    console.log(chalk.yellow(`  Prefix: ${config.prefix}`));
    console.log(chalk.yellow(`  Owner: ${config.owner || "Not registered"}`));
    console.log(chalk.yellow(`  NSFW: ${config.nsfwEnabled ? "Enabled" : "Disabled"}`));
    console.log(chalk.cyan("========================================\n"));

    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: pino({ level: "silent" }),
        auth: state,
        version,
        browser: ["WhatsApp Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    // Connection update
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Handle QR Code
        if (qr) {
            console.log(chalk.cyan("\n========================================"));
            console.log(chalk.yellow("  📱 SCAN QR CODE BELOW"));
            console.log(chalk.cyan("========================================\n"));
            qrcode.generate(qr, { small: true });
            console.log(chalk.cyan("\n========================================"));
            console.log(chalk.yellow("  Scan dengan WhatsApp kamu!"));
            console.log(chalk.cyan("========================================\n"));
        }
        
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            log("Connection closed", "error");
            
            if (shouldReconnect) {
                log("Reconnecting...", "warn");
                setTimeout(() => startBot(), 5000);
            } else {
                log("Logged out. Delete session folder and restart.", "error");
            }
        } else if (connection === "open") {
            log("Bot connected successfully!", "success");
            console.log(chalk.green("\n========================================"));
            console.log(chalk.cyan("  ✅ BOT SUDAH TERHUBUNG!"));
            console.log(chalk.green("========================================"));
            console.log(chalk.yellow("  📝 Kirim .menu untuk melihat commands"));
            console.log(chalk.green("========================================\n"));
        }
    });

    // Messages handler
    sock.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message || msg.key.fromMe) return;

            const from = msg.key.remoteJid;
            const isGroup = from.endsWith("@g.us");
            const sender = isGroup ? msg.key.participant : from;
            
            const body =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message.imageMessage?.caption ||
                msg.message.videoMessage?.caption ||
                "";

            // Check if message starts with prefix
            if (!body.startsWith(config.prefix)) return;

            // Log command
            const senderNumber = sender.split("@")[0];
            log(`Command from ${senderNumber}: ${body}`, "info");

            // Cooldown check (skip for owner)
            const cooldown = checkCooldown(sender, config);
            if (cooldown.onCooldown && !body.startsWith(".code")) {
                await sock.sendMessage(from, {
                    text: `⏳ *Cooldown!*\n\nTunggu ${cooldown.remaining} detik lagi.`
                }, { quoted: msg });
                return;
            }

            // Handle commands based on category
            
            // Owner commands
            await handleOwnerCommands(sock, msg, body, from);

            // Admin commands (group only)
            if (isGroup) {
                await handleAdminCommands(sock, msg, body, from, isGroup);
            }

            // Downloader commands
            await handleDownloaderCommands(sock, msg, body, from);

            // Game commands
            await handleGameCommands(sock, msg, body, from);

            // NSFW commands
            await handleNSFWCommands(sock, msg, body, from);

            // Original sticker features
            // Image to sticker
            if (msg.message.imageMessage && body === ".sticker") {
                const buffer = await downloadMediaMessage(
                    msg,
                    "buffer",
                    {},
                    { logger: pino(), reuploadRequest: sock.updateMediaMessage }
                );

                const sticker = await sharp(buffer)
                    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .webp({ quality: 80 })
                    .toBuffer();

                await sock.sendMessage(from, { sticker: sticker }, { quoted: msg });
                log("Image to sticker converted", "success");
            }

            // Sticker to image
            if (msg.message.stickerMessage && body === ".toimg") {
                const buffer = await downloadMediaMessage(
                    msg,
                    "buffer",
                    {},
                    { logger: pino(), reuploadRequest: sock.updateMediaMessage }
                );

                const image = await sharp(buffer)
                    .png()
                    .toBuffer();

                await sock.sendMessage(from, { image: image }, { quoted: msg });
                log("Sticker to image converted", "success");
            }

            // Brat style text sticker
            if (body.startsWith(".brat ")) {
                const text = body.replace(".brat ", "");
                const { createCanvas } = require("canvas");

                const width = 512;
                const height = 512;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext("2d");

                ctx.fillStyle = "#8ACE00";
                ctx.fillRect(0, 0, width, height);

                ctx.fillStyle = "#000000";
                ctx.font = "bold 48px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                wrapText(ctx, text.toLowerCase(), width / 2, height / 2, 450, 60);

                const buffer = canvas.toBuffer("image/png");

                const sticker = await sharp(buffer)
                    .webp({ quality: 90 })
                    .toBuffer();

                await sock.sendMessage(from, { sticker: sticker }, { quoted: msg });
                log("Brat sticker created", "success");
            }

            // Menu command
            if (body === ".menu" || body === ".help") {
                const menuText = `🤖 *${config.botName}*\n\n` +
                    `*👑 OWNER COMMANDS:*\n` +
                    `├ .code <16digit> - Register owner (1x only)\n` +
                    `├ .apidownload <url> - Set downloader API\n` +
                    `├ .settimeout <detik> - Set game timeout\n` +
                    `├ .nsfwtoggle - Toggle NSFW mode\n` +
                    `└ .config - Show bot config\n\n` +
                    `*👥 ADMIN COMMANDS:*\n` +
                    `├ .kick @user - Kick member\n` +
                    `├ .add <nomor> - Add member\n` +
                    `├ .promote @user - Promote to admin\n` +
                    `├ .demote @user - Demote admin\n` +
                    `├ .tagall <pesan> - Tag all members\n` +
                    `├ .hidetag <pesan> - Hidden tag\n` +
                    `├ .groupinfo - Group info\n` +
                    `├ .listonline - List members\n` +
                    `├ .group <open/close> - Open/close group\n` +
                    `├ .setname <nama> - Change group name\n` +
                    `├ .setdesc <text> - Change description\n` +
                    `└ .link - Get invite link\n\n` +
                    `*📥 DOWNLOADER:*\n` +
                    `├ .ytmp4 <url/query> - YouTube video\n` +
                    `├ .ytmp3 <url/query> - YouTube audio\n` +
                    `├ .yts <query> - Search YouTube\n` +
                    `├ .tiktok <url> - TikTok no watermark\n` +
                    `├ .tiktokmp3 <url> - TikTok audio\n` +
                    `├ .ig <url> - Instagram post/reel\n` +
                    `├ .fb <url> - Facebook video\n` +
                    `├ .twitter <url> - Twitter media\n` +
                    `├ .dl <url> - Auto-detect platform\n` +
                    `├ .pinterest <url> - Pinterest image\n` +
                    `├ .soundcloud <url> - SoundCloud audio\n` +
                    `└ .mediafire <url> - MediaFire file\n\n` +
                    `*🎮 GAMES:*\n` +
                    `├ .tebakkata - Guess the word\n` +
                    `├ .tebakbendera - Guess the flag\n` +
                    `├ .asahotak - Brain teaser\n` +
                    `├ .hint - Show hint\n` +
                    `├ .leaderboard - Top players\n` +
                    `└ .mystats - Your statistics\n\n` +
                    `*🔞 NSFW:* (Owner only toggle)\n` +
                    `└ .nsfwmenu - Show NSFW commands\n\n` +
                    `*🎨 STICKER:*\n` +
                    `├ .sticker - Image to sticker\n` +
                    `├ .toimg - Sticker to image\n` +
                    `└ .brat <text> - Brat style sticker\n\n` +
                    `_Prefix: ${config.prefix}_`;

                await sock.sendMessage(from, {
                    text: menuText
                }, { quoted: msg });
            }

        } catch (error) {
            log(`Error: ${error.message}`, "error");
            console.error(error);
        }
    });
}

// Helper function for text wrapping
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let lines = [];

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + " ";
        } else {
            line = testLine;
        }
    }

    lines.push(line);

    const totalHeight = lines.length * lineHeight;
    let startY = y - totalHeight / 2;

    lines.forEach((l) => {
        ctx.fillText(l, x, startY);
        startY += lineHeight;
    });
}

// Start the bot
startBot().catch((err) => {
    console.error("Failed to start bot:", err);
    process.exit(1);
});

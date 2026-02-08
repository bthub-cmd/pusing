const { default: makeWASocket, useMultiFileAuthState, downloadMediaMessage, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");
const chalk = require("chalk");
const qrcode = require("qrcode-terminal");
const { loadConfig, saveConfig, checkCooldown, generateCode, log, isOwner, loadBanner, formatBanner } = require("./utils/helpers");
const { handleOwnerCommands } = require("./commands/owner");
const { handleAdminCommands } = require("./commands/admin");
const { handleDownloaderCommands } = require("./commands/downloader");
const { handleGameCommands } = require("./commands/games");
const { handleNSFWCommands } = require("./commands/nsfw");

// Generate auth code on first run
function initAuthCode() {
    const authCodePath = path.join(__dirname, "auth-code.txt");
    const config = loadConfig();
    
    // Always show code if owner not registered yet
    if (!config.ownerRegistered) {
        let code;
        
        if (fs.existsSync(authCodePath)) {
            // Read existing code
            code = fs.readFileSync(authCodePath, "utf-8").trim();
        } else {
            // Generate new code
            code = generateCode(16);
            fs.writeFileSync(authCodePath, code);
        }
        
        // Always display code
        console.log(chalk.green("\n========================================"));
        console.log(chalk.yellow("  🔐 OWNER REGISTRATION CODE"));
        console.log(chalk.green("========================================"));
        console.log(chalk.cyan(`  Code: ${chalk.bold(code)}`));
        console.log(chalk.green("========================================"));
        console.log(chalk.yellow("  Gunakan command: .code <kode>"));
        console.log(chalk.yellow("  untuk registrasi sebagai owner!"));
        console.log(chalk.green("========================================\n"));
    } else {
        console.log(chalk.green("\n✅ Owner sudah terdaftar!\n"));
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

            // Cooldown check (skip for owner and certain commands)
            const skipCooldown = [".code", ".menu", ".help"];
            const cooldown = checkCooldown(sender, config);
            
            if (cooldown.onCooldown && !skipCooldown.some(cmd => body.startsWith(cmd))) {
                const cooldownMsg = await sock.sendMessage(from, {
                    text: `⏳ *Cooldown!*\n\nTunggu ${cooldown.remaining} detik lagi...`
                }, { quoted: msg });

                // Store cooldown info for later reply
                setTimeout(async () => {
                    try {
                        // User's original request will be processed after cooldown
                        // This is handled by the normal command flow
                    } catch (error) {
                        log(`Cooldown timer error: ${error.message}`, "error");
                    }
                }, cooldown.remaining * 1000);
                
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
                try {
                    const buffer = await downloadMediaMessage(
                        msg,
                        "buffer",
                        {},
                        { logger: pino(), reuploadRequest: sock.updateMediaMessage }
                    );

                    // Get image metadata
                    const metadata = await sharp(buffer).metadata();
                    const width = metadata.width;
                    const height = metadata.height;
                    
                    let resizeOptions;
                    
                    // Smart resize based on input size
                    if (width >= 512 && height >= 512) {
                        // Image is large enough, use cover (crop if needed)
                        resizeOptions = {
                            width: 512,
                            height: 512,
                            fit: "cover",
                            position: "center"
                        };
                    } else {
                        // Image is small, use contain (add transparent padding)
                        resizeOptions = {
                            width: 512,
                            height: 512,
                            fit: "contain",
                            background: { r: 0, g: 0, b: 0, alpha: 0 }
                        };
                    }

                    const sticker = await sharp(buffer)
                        .resize(resizeOptions)
                        .webp({ quality: 80 })
                        .toBuffer();

                    await sock.sendMessage(from, { sticker: sticker }, { quoted: msg });
                    log(`Image to sticker converted (${width}x${height} → 512x512)`, "success");
                } catch (error) {
                    log(`Error creating sticker: ${error.message}`, "error");
                    await sock.sendMessage(from, {
                        text: `❌ *Gagal membuat sticker!*\n\n${error.message}`
                    }, { quoted: msg });
                }
            }

            // Sticker to image
            if (msg.message.stickerMessage && body === ".toimg") {
                try {
                    const buffer = await downloadMediaMessage(
                        msg,
                        "buffer",
                        {},
                        { logger: pino(), reuploadRequest: sock.updateMediaMessage }
                    );

                    // Convert WebP to PNG
                    const image = await sharp(buffer)
                        .png()
                        .toBuffer();

                    await sock.sendMessage(from, { 
                        image: image,
                        caption: "✅ Sticker converted to image"
                    }, { quoted: msg });
                    
                    log("Sticker to image converted", "success");
                } catch (error) {
                    log(`Error converting sticker: ${error.message}`, "error");
                    await sock.sendMessage(from, {
                        text: `❌ *Gagal convert sticker!*\n\n${error.message}`
                    }, { quoted: msg });
                }
            }

            // Brat style text sticker with color presets
            if (body.startsWith(".brat ")) {
                const args = body.replace(".brat ", "").trim().split(" ");
                let colorPreset = "default";
                let text = "";

                // Check if first word is a color preset
                const presets = ["green", "pink", "blue", "dark"];
                if (presets.includes(args[0].toLowerCase())) {
                    colorPreset = args[0].toLowerCase();
                    text = args.slice(1).join(" ");
                } else {
                    text = args.join(" ");
                }

                if (!text) {
                    await sock.sendMessage(from, {
                        text: "❌ *Teks kosong!*\n\n" +
                              "*Format:*\n" +
                              "• .brat <text> - White/Black (default)\n" +
                              "• .brat green <text> - Green/Black\n" +
                              "• .brat pink <text> - Pink/White\n" +
                              "• .brat blue <text> - Blue/White\n" +
                              "• .brat dark <text> - Black/White"
                    }, { quoted: msg });
                    return;
                }

                const { createCanvas } = require("canvas");

                // Color schemes
                const colors = {
                    default: { bg: "#FFFFFF", text: "#000000" },  // White/Black
                    green: { bg: "#8ACE00", text: "#000000" },    // Original brat
                    pink: { bg: "#FF69B4", text: "#FFFFFF" },     // Pink/White
                    blue: { bg: "#1E90FF", text: "#FFFFFF" },     // Blue/White
                    dark: { bg: "#000000", text: "#FFFFFF" }      // Black/White
                };

                const scheme = colors[colorPreset];

                const width = 512;
                const height = 512;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext("2d");

                ctx.fillStyle = scheme.bg;
                ctx.fillRect(0, 0, width, height);

                ctx.fillStyle = scheme.text;
                ctx.font = "bold 48px Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                wrapText(ctx, text.toLowerCase(), width / 2, height / 2, 450, 60);

                const buffer = canvas.toBuffer("image/png");

                const sticker = await sharp(buffer)
                    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
                    .webp({ quality: 90 })
                    .toBuffer();

                await sock.sendMessage(from, { sticker: sticker }, { quoted: msg });
                log(`Brat sticker created (${colorPreset})`, "success");
            }

            // Menu command - Simple text with spacing
            if (body === ".menu" || body === ".help") {
                const banner = loadBanner();
                const userIsOwner = isOwner(sender, config);

                // Build menu text
                let menuText = formatBanner(banner) + "\n━━━━━━━━━━━━━━━━━━━━━\n\n";

                // Owner commands (only if owner)
                if (userIsOwner) {
                    menuText += `👑 OWNER COMMANDS\n\n`;
                    menuText += `├ .code <16digit> - Register owner\n`;
                    menuText += `├ .apidownload <url> - Set API downloader\n`;
                    menuText += `├ .settimeout <sec> - Set game timeout\n`;
                    menuText += `├ .setnsfw on/off - Toggle NSFW\n`;
                    menuText += `├ .config - View configuration\n`;
                    menuText += `├ .setbanner <text> - Set banner title\n`;
                    menuText += `├ .setsubtitle <text> - Set banner subtitle\n`;
                    menuText += `├ .setdesc <text> - Set description\n`;
                    menuText += `├ .setbannerimg - Set banner image (reply)\n`;
                    menuText += `├ .removebannerimg - Remove banner image\n`;
                    menuText += `├ .previewbanner - Preview banner\n`;
                    menuText += `└ .resetbanner - Reset to default\n\n\n`;
                }

                // Admin commands
                menuText += `👥 ADMIN COMMANDS\n\n`;
                menuText += `├ .kick @user - Kick member\n`;
                menuText += `├ .add <nomor> - Add member\n`;
                menuText += `├ .promote @user - Promote to admin\n`;
                menuText += `├ .demote @user - Demote admin\n`;
                menuText += `├ .tagall <msg> - Tag all members\n`;
                menuText += `├ .hidetag <msg> - Hidden tag\n`;
                menuText += `├ .groupinfo - Group information\n`;
                menuText += `├ .listonline - List members\n`;
                menuText += `├ .group open/close - Open/close group\n`;
                menuText += `├ .setname <nama> - Change group name\n`;
                menuText += `├ .setdesc <text> - Change description\n`;
                menuText += `└ .link - Get invite link\n\n\n`;

                // Downloader (only if API is set)
                if (config.downloaderAPI) {
                    menuText += `📥 MEDIA DOWNLOADER\n\n`;
                    menuText += `├ .ytmp4 <url> - YouTube video\n`;
                    menuText += `├ .ytmp3 <url> - YouTube audio\n`;
                    menuText += `├ .yts <query> - Search YouTube\n`;
                    menuText += `├ .tiktok <url> - TikTok no watermark\n`;
                    menuText += `├ .tiktokmp3 <url> - TikTok audio\n`;
                    menuText += `├ .ig <url> - Instagram post/reel\n`;
                    menuText += `├ .fb <url> - Facebook video\n`;
                    menuText += `├ .twitter <url> - Twitter media\n`;
                    menuText += `├ .dl <url> - Auto-detect platform\n`;
                    menuText += `├ .pinterest <url> - Pinterest image\n`;
                    menuText += `├ .soundcloud <url> - SoundCloud audio\n`;
                    menuText += `└ .mediafire <url> - MediaFire file\n\n\n`;
                }

                // Games
                menuText += `🎮 MINI GAMES\n\n`;
                menuText += `├ .tebakkata - Tebak kata\n`;
                menuText += `├ .tebakbendera - Tebak bendera\n`;
                menuText += `├ .asahotak - Asah otak\n`;
                menuText += `├ .hint - Show hint\n`;
                menuText += `├ .leaderboard - Top players\n`;
                menuText += `└ .mystats - Your statistics\n\n\n`;

                // Sticker tools
                menuText += `🎨 STICKER TOOLS\n\n`;
                menuText += `├ .sticker - Image to sticker (reply)\n`;
                menuText += `├ .toimg - Sticker to image (reply)\n`;
                menuText += `├ .brat <text> - Brat white/black\n`;
                menuText += `├ .brat green <text> - Brat green/black\n`;
                menuText += `├ .brat pink <text> - Brat pink/white\n`;
                menuText += `├ .brat blue <text> - Brat blue/white\n`;
                menuText += `└ .brat dark <text> - Brat black/white\n\n\n`;

                // NSFW (only if enabled)
                if (config.nsfwEnabled) {
                    menuText += `🔞 NSFW (18+)\n\n`;
                    menuText += `├ .nsfwmenu - NSFW menu\n`;
                    menuText += `├ .waifu - Random waifu\n`;
                    menuText += `├ .neko - Random neko\n`;
                    menuText += `├ .hentai - Random hentai\n`;
                    menuText += `├ .trap - Random trap\n`;
                    menuText += `├ .xvideos <query> - Search Xvideos\n`;
                    menuText += `└ .xnxx <query> - Search XNXX\n\n\n`;
                }

                menuText += `━━━━━━━━━━━━━━━━━━━━━\n`;
                menuText += `Prefix: ${config.prefix}`;

                // Send menu with or without banner image
                if (banner.image) {
                    try {
                        const imageBuffer = Buffer.from(banner.image, "base64");
                        await sock.sendMessage(from, {
                            image: imageBuffer,
                            caption: menuText
                        }, { quoted: msg });
                    } catch (error) {
                        // Fallback to text only if image fails
                        await sock.sendMessage(from, {
                            text: menuText
                        }, { quoted: msg });
                    }
                } else {
                    await sock.sendMessage(from, {
                        text: menuText
                    }, { quoted: msg });
                }

                log("Menu displayed", "success");
            }
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

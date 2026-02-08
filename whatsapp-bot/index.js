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
                const buffer = await downloadMediaMessage(
                    msg,
                    "buffer",
                    {},
                    { logger: pino(), reuploadRequest: sock.updateMediaMessage }
                );

                const sticker = await sharp(buffer)
                    .resize(512, 512, { 
                        fit: "contain", 
                        background: { r: 0, g: 0, b: 0, alpha: 0 } 
                    })
                    .webp({ quality: 80 })
                    .toBuffer();

                await sock.sendMessage(from, { sticker: sticker }, { quoted: msg });
                log("Image to sticker converted", "success");
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

            // Menu command with interactive button
            if (body === ".menu" || body === ".help") {
                const banner = loadBanner();
                const userIsOwner = isOwner(sender, config);

                // Build sections for interactive list
                const sections = [];

                // Owner section (only if owner)
                if (userIsOwner) {
                    sections.push({
                        title: "👑 Owner Commands",
                        rows: [
                            { title: "Register Owner", description: ".code <16digit>", rowId: "owner_code" },
                            { title: "Set API Downloader", description: ".apidownload <url>", rowId: "owner_api" },
                            { title: "Set Game Timeout", description: ".settimeout <sec>", rowId: "owner_timeout" },
                            { title: "Toggle NSFW", description: ".nsfwtoggle", rowId: "owner_nsfw" },
                            { title: "View Config", description: ".config", rowId: "owner_config" },
                            { title: "Set Banner Title", description: ".setbanner <text>", rowId: "owner_banner" },
                            { title: "Set Banner Subtitle", description: ".setsubtitle <text>", rowId: "owner_subtitle" },
                            { title: "Set Banner Image", description: ".setbannerimg (reply img)", rowId: "owner_bannerimg" },
                            { title: "Preview Banner", description: ".previewbanner", rowId: "owner_preview" },
                            { title: "Reset Banner", description: ".resetbanner", rowId: "owner_reset" }
                        ]
                    });
                }

                // Admin section
                sections.push({
                    title: "👥 Admin Commands",
                    rows: [
                        { title: "Kick Member", description: ".kick @user", rowId: "admin_kick" },
                        { title: "Add Member", description: ".add <nomor>", rowId: "admin_add" },
                        { title: "Promote Admin", description: ".promote @user", rowId: "admin_promote" },
                        { title: "Demote Admin", description: ".demote @user", rowId: "admin_demote" },
                        { title: "Tag All", description: ".tagall <pesan>", rowId: "admin_tagall" },
                        { title: "Hidden Tag", description: ".hidetag <pesan>", rowId: "admin_hidetag" },
                        { title: "Group Info", description: ".groupinfo", rowId: "admin_info" },
                        { title: "List Members", description: ".listonline", rowId: "admin_list" },
                        { title: "Open/Close Group", description: ".group <open/close>", rowId: "admin_group" },
                        { title: "Set Group Name", description: ".setname <nama>", rowId: "admin_name" },
                        { title: "Get Invite Link", description: ".link", rowId: "admin_link" }
                    ]
                });

                // Downloader section (only if API is set)
                if (config.downloaderAPI) {
                    sections.push({
                        title: "📥 Media Downloader",
                        rows: [
                            { title: "YouTube Video", description: ".ytmp4 <url>", rowId: "dl_ytmp4" },
                            { title: "YouTube Audio", description: ".ytmp3 <url>", rowId: "dl_ytmp3" },
                            { title: "Search YouTube", description: ".yts <query>", rowId: "dl_yts" },
                            { title: "TikTok Video", description: ".tiktok <url>", rowId: "dl_tiktok" },
                            { title: "TikTok Audio", description: ".tiktokmp3 <url>", rowId: "dl_ttmp3" },
                            { title: "Instagram", description: ".ig <url>", rowId: "dl_ig" },
                            { title: "Facebook", description: ".fb <url>", rowId: "dl_fb" },
                            { title: "Twitter", description: ".twitter <url>", rowId: "dl_twitter" },
                            { title: "Auto Download", description: ".dl <url>", rowId: "dl_auto" },
                            { title: "Pinterest", description: ".pinterest <url>", rowId: "dl_pinterest" },
                            { title: "SoundCloud", description: ".soundcloud <url>", rowId: "dl_sc" },
                            { title: "MediaFire", description: ".mediafire <url>", rowId: "dl_mf" }
                        ]
                    });
                }

                // Games section
                sections.push({
                    title: "🎮 Mini Games",
                    rows: [
                        { title: "Tebak Kata", description: ".tebakkata", rowId: "game_kata" },
                        { title: "Tebak Bendera", description: ".tebakbendera", rowId: "game_bendera" },
                        { title: "Asah Otak", description: ".asahotak", rowId: "game_otak" },
                        { title: "Hint", description: ".hint", rowId: "game_hint" },
                        { title: "Leaderboard", description: ".leaderboard", rowId: "game_lb" },
                        { title: "My Stats", description: ".mystats", rowId: "game_stats" }
                    ]
                });

                // Sticker section
                sections.push({
                    title: "🎨 Sticker Tools",
                    rows: [
                        { title: "Image to Sticker", description: ".sticker (reply img)", rowId: "sticker_img" },
                        { title: "Sticker to Image", description: ".toimg (reply sticker)", rowId: "sticker_toimg" },
                        { title: "Brat Default", description: ".brat <text>", rowId: "brat_default" },
                        { title: "Brat Green", description: ".brat green <text>", rowId: "brat_green" },
                        { title: "Brat Pink", description: ".brat pink <text>", rowId: "brat_pink" },
                        { title: "Brat Blue", description: ".brat blue <text>", rowId: "brat_blue" },
                        { title: "Brat Dark", description: ".brat dark <text>", rowId: "brat_dark" }
                    ]
                });

                // NSFW section (only if enabled)
                if (config.nsfwEnabled) {
                    sections.push({
                        title: "🔞 NSFW (18+)",
                        rows: [
                            { title: "NSFW Menu", description: ".nsfwmenu", rowId: "nsfw_menu" },
                            { title: "Random Waifu", description: ".waifu", rowId: "nsfw_waifu" },
                            { title: "Random Neko", description: ".neko", rowId: "nsfw_neko" },
                            { title: "Random Hentai", description: ".hentai", rowId: "nsfw_hentai" },
                            { title: "Random Trap", description: ".trap", rowId: "nsfw_trap" }
                        ]
                    });
                }

                // Send banner with button
                const bannerText = formatBanner(banner);
                
                const listMessage = {
                    text: bannerText,
                    footer: "Pilih kategori untuk melihat commands",
                    title: "📋 Menu Bot",
                    buttonText: "📋 Lihat Semua Menu",
                    sections
                };

                if (banner.image) {
                    const imageBuffer = Buffer.from(banner.image, "base64");
                    await sock.sendMessage(from, {
                        image: imageBuffer,
                        caption: bannerText + "\n\n━━━━━━━━━━━━━━━━━━━━━\n\n👇 Klik tombol di bawah untuk melihat semua commands!"
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, listMessage, { quoted: msg });
                }

                log("Menu displayed with interactive list", "success");
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

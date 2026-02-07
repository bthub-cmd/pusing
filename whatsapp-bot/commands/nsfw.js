const { loadConfig, log } = require("../utils/helpers");
const { getWaifuIM, getNekosLife, getHentai, searchXvideos, searchXNXX } = require("../utils/scrapers");

async function handleNSFWCommands(sock, msg, body, from) {
    const config = loadConfig();

    // Check if NSFW is enabled
    if (!config.nsfwEnabled) {
        if (body.startsWith(".nsfw") || body === ".waifu" || body === ".neko" ||
            body === ".hentai" || body === ".trap" || body === ".nsfwmenu" ||
            body.startsWith(".xvideos") || body.startsWith(".xnxx")) {
            await sock.sendMessage(from, {
                text: "🔞 *NSFW Mode NONAKTIF!*\n\n" +
                      "Owner belum mengaktifkan fitur NSFW.\n" +
                      "Hubungi owner untuk mengaktifkan dengan command:\n" +
                      ".nsfwtoggle"
            }, { quoted: msg });
        }
        return;
    }

    // NSFW Menu
    if (body === ".nsfwmenu") {
        const menuText = `🔞 *NSFW COMMANDS*\n\n` +
            `*Random Images:*\n` +
            `├ .nsfw waifu - Random NSFW waifu\n` +
            `├ .nsfw neko - Random NSFW neko\n` +
            `├ .nsfw trap - Random trap image\n` +
            `├ .nsfw blowjob - Random blowjob\n` +
            `└ .nsfw hentai - Random hentai\n\n` +
            `*Quick Commands:*\n` +
            `├ .waifu - Random NSFW waifu\n` +
            `├ .neko - Random NSFW neko\n` +
            `├ .hentai - Random hentai\n` +
            `└ .trap - Random trap\n\n` +
            `*Adult Sites Search:*\n` +
            `├ .xvideos <query> - Search Xvideos\n` +
            `└ .xnxx <query> - Search XNXX\n\n` +
            `⚠️ *Warning:* Content is 18+ only!`;

        await sock.sendMessage(from, {
            text: menuText
        }, { quoted: msg });

        log(`NSFW menu displayed`, "info");
        return;
    }

    // NSFW by category
    if (body.startsWith(".nsfw ")) {
        const category = body.replace(".nsfw ", "").toLowerCase().trim();
        const validCategories = ["waifu", "neko", "trap", "blowjob", "hentai"];

        if (!validCategories.includes(category)) {
            await sock.sendMessage(from, {
                text: `❌ *Kategori tidak valid!*\n\n` +
                      `Kategori yang tersedia:\n` +
                      validCategories.join(", ")
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(from, {
            text: `🔍 Searching ${category}...`
        }, { quoted: msg });

        try {
            let result;
            
            if (category === "hentai") {
                result = await getHentai();
            } else if (["waifu", "neko"].includes(category)) {
                result = await getWaifuIM(category, true);
            } else {
                result = await getNekosLife(category);
            }

            if (result.success && result.url) {
                await sock.sendMessage(from, {
                    image: { url: result.url },
                    caption: `🔞 *NSFW ${category.toUpperCase()}*\n\n` +
                            `${result.source ? `Source: ${result.source}` : ""}\n\n` +
                            `_Request by: @${msg.key.remoteJid.split("@")[0]}_`,
                    mentions: [msg.key.remoteJid]
                });

                log(`NSFW ${category} sent`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Gagal mengambil gambar!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Quick command: Waifu
    if (body === ".waifu") {
        await sock.sendMessage(from, {
            text: `🔍 Searching waifu...`
        }, { quoted: msg });

        try {
            const result = await getWaifuIM("waifu", true);

            if (result.success && result.url) {
                await sock.sendMessage(from, {
                    image: { url: result.url },
                    caption: `🔞 *NSFW WAIFU*\n\n` +
                            `${result.source ? `Source: ${result.source}` : ""}\n\n` +
                            `_Request by: @${msg.key.remoteJid.split("@")[0]}_`,
                    mentions: [msg.key.remoteJid]
                });

                log(`NSFW waifu sent`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Gagal mengambil gambar!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Quick command: Neko
    if (body === ".neko") {
        await sock.sendMessage(from, {
            text: `🔍 Searching neko...`
        }, { quoted: msg });

        try {
            const result = await getNekosLife("neko");

            if (result.success && result.url) {
                await sock.sendMessage(from, {
                    image: { url: result.url },
                    caption: `🔞 *NSFW NEKO*\n\n` +
                            `_Request by: @${msg.key.remoteJid.split("@")[0]}_`,
                    mentions: [msg.key.remoteJid]
                });

                log(`NSFW neko sent`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Gagal mengambil gambar!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Quick command: Hentai
    if (body === ".hentai") {
        await sock.sendMessage(from, {
            text: `🔍 Searching hentai...`
        }, { quoted: msg });

        try {
            const result = await getHentai();

            if (result.success && result.url) {
                await sock.sendMessage(from, {
                    image: { url: result.url },
                    caption: `🔞 *HENTAI*\n\n` +
                            `_Request by: @${msg.key.remoteJid.split("@")[0]}_`,
                    mentions: [msg.key.remoteJid]
                });

                log(`Hentai sent`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Gagal mengambil gambar!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Quick command: Trap
    if (body === ".trap") {
        await sock.sendMessage(from, {
            text: `🔍 Searching trap...`
        }, { quoted: msg });

        try {
            const result = await getNekosLife("trap");

            if (result.success && result.url) {
                await sock.sendMessage(from, {
                    image: { url: result.url },
                    caption: `🔞 *TRAP*\n\n` +
                            `_Request by: @${msg.key.remoteJid.split("@")[0]}_`,
                    mentions: [msg.key.remoteJid]
                });

                log(`Trap sent`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Gagal mengambil gambar!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Xvideos search
    if (body.startsWith(".xvideos ")) {
        const query = body.replace(".xvideos ", "").trim();

        await sock.sendMessage(from, {
            text: `🔞 Searching Xvideos for: ${query}...`
        }, { quoted: msg });

        try {
            const result = await searchXvideos(query);

            if (result.success && result.results && result.results.length > 0) {
                let text = `🔞 *XVIDEOS SEARCH RESULTS*\n\nQuery: ${query}\n\n`;

                result.results.slice(0, 10).forEach((video, i) => {
                    text += `${i + 1}. ${video.title}\n`;
                    text += `   ⏱️ ${video.duration}\n`;
                    text += `   🔗 ${video.url}\n\n`;
                });

                text += `⚠️ *18+ Content Only*`;

                await sock.sendMessage(from, {
                    text: text
                }, { quoted: msg });

                log(`Xvideos search: ${query}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Tidak ada hasil!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // XNXX search
    if (body.startsWith(".xnxx ")) {
        const query = body.replace(".xnxx ", "").trim();

        await sock.sendMessage(from, {
            text: `🔞 Searching XNXX for: ${query}...`
        }, { quoted: msg });

        try {
            const result = await searchXNXX(query);

            if (result.success && result.results && result.results.length > 0) {
                let text = `🔞 *XNXX SEARCH RESULTS*\n\nQuery: ${query}\n\n`;

                result.results.slice(0, 10).forEach((video, i) => {
                    text += `${i + 1}. ${video.title}\n`;
                    text += `   ⏱️ ${video.duration}\n`;
                    text += `   🔗 ${video.url}\n\n`;
                });

                text += `⚠️ *18+ Content Only*`;

                await sock.sendMessage(from, {
                    text: text
                }, { quoted: msg });

                log(`XNXX search: ${query}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Tidak ada hasil!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }
}

module.exports = { handleNSFWCommands };

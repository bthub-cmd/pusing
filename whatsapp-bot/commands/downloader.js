const axios = require("axios");
const { loadConfig, log } = require("../utils/helpers");

async function handleDownloaderCommands(sock, msg, body, from) {
    const config = loadConfig();

    // Check if API is set
    if (!config.downloaderAPI) {
        if (body.startsWith(".ytmp4") || body.startsWith(".ytmp3") || 
            body.startsWith(".yts") || body.startsWith(".tiktok") ||
            body.startsWith(".tiktokmp3") || body.startsWith(".ig") ||
            body.startsWith(".igstory") || body.startsWith(".fb") ||
            body.startsWith(".twitter") || body.startsWith(".dl") ||
            body.startsWith(".pinterest") || body.startsWith(".soundcloud") ||
            body.startsWith(".mediafire")) {
            await sock.sendMessage(from, {
                text: "❌ *Downloader API belum diset!*\n\n" +
                      "Owner harus set API terlebih dahulu dengan command:\n" +
                      ".apidownload <url_api>"
            }, { quoted: msg });
        }
        return;
    }

    // Helper function to download from API
    async function downloadFromAPI(url, type = "video") {
        try {
            const response = await axios.get(`${config.downloaderAPI}/download`, {
                params: { url: url, type: type },
                timeout: 60000
            });

            if (response.data && response.data.status) {
                return {
                    success: true,
                    data: response.data.result
                };
            }

            return {
                success: false,
                message: response.data?.message || "Download failed"
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // YouTube MP4 Download
    if (body.startsWith(".ytmp4 ")) {
        const query = body.replace(".ytmp4 ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Downloading...*\n\nMohon tunggu, video sedang diproses..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(query, "ytmp4");

            if (result.success && result.data.url) {
                await sock.sendMessage(from, {
                    video: { url: result.data.url },
                    caption: `✅ *YouTube Video Downloaded*\n\n` +
                            `📌 Title: ${result.data.title || "Unknown"}\n` +
                            `🎬 Quality: 360p\n\n` +
                            `_Powered by ${config.botName}_`,
                    mimetype: "video/mp4"
                }, { quoted: msg });

                log(`YT MP4 downloaded: ${result.data.title}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // YouTube MP3 Download
    if (body.startsWith(".ytmp3 ")) {
        const query = body.replace(".ytmp3 ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Downloading...*\n\nMohon tunggu, audio sedang diproses..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(query, "ytmp3");

            if (result.success && result.data.url) {
                await sock.sendMessage(from, {
                    audio: { url: result.data.url },
                    caption: `✅ *YouTube Audio Downloaded*\n\n` +
                            `📌 Title: ${result.data.title || "Unknown"}\n` +
                            `🎵 Format: MP3\n\n` +
                            `_Powered by ${config.botName}_`,
                    mimetype: "audio/mp4"
                }, { quoted: msg });

                log(`YT MP3 downloaded: ${result.data.title}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // YouTube Search
    if (body.startsWith(".yts ")) {
        const query = body.replace(".yts ", "").trim();

        await sock.sendMessage(from, {
            text: "🔍 *Searching YouTube...*"
        }, { quoted: msg });

        try {
            const response = await axios.get(`${config.downloaderAPI}/search`, {
                params: { query: query, platform: "youtube" },
                timeout: 30000
            });

            if (response.data && response.data.status && response.data.result) {
                const results = response.data.result.slice(0, 10);
                let text = `🔍 *YouTube Search Results*\n\nQuery: ${query}\n\n`;

                results.forEach((video, i) => {
                    text += `${i + 1}. ${video.title}\n`;
                    text += `   ⏱️ ${video.duration || "N/A"}\n`;
                    text += `   👁️ ${video.views || "N/A"}\n`;
                    text += `   🔗 ${video.url}\n\n`;
                });

                text += `_Gunakan .ytmp4 atau .ytmp3 untuk download_`;

                await sock.sendMessage(from, {
                    text: text
                }, { quoted: msg });

                log(`YouTube search: ${query}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: "❌ *Tidak ada hasil!*"
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // TikTok Download
    if (body.startsWith(".tiktok ")) {
        const url = body.replace(".tiktok ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Downloading TikTok...*\n\nMohon tunggu..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(url, "tiktok");

            if (result.success && result.data.url) {
                await sock.sendMessage(from, {
                    video: { url: result.data.url },
                    caption: `✅ *TikTok Video Downloaded*\n\n` +
                            `📌 Title: ${result.data.title || "TikTok Video"}\n` +
                            `👤 Author: ${result.data.author || "Unknown"}\n` +
                            `💧 No Watermark\n\n` +
                            `_Powered by ${config.botName}_`,
                    mimetype: "video/mp4"
                }, { quoted: msg });

                log(`TikTok downloaded: ${result.data.title}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // TikTok MP3
    if (body.startsWith(".tiktokmp3 ")) {
        const url = body.replace(".tiktokmp3 ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Extracting audio...*\n\nMohon tunggu..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(url, "tiktokmp3");

            if (result.success && result.data.url) {
                await sock.sendMessage(from, {
                    audio: { url: result.data.url },
                    caption: `✅ *TikTok Audio Extracted*\n\n` +
                            `📌 Title: ${result.data.title || "TikTok Audio"}\n` +
                            `🎵 Format: MP3\n\n` +
                            `_Powered by ${config.botName}_`,
                    mimetype: "audio/mp4"
                }, { quoted: msg });

                log(`TikTok MP3 extracted: ${result.data.title}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Extract gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Instagram Download
    if (body.startsWith(".ig ")) {
        const url = body.replace(".ig ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Downloading Instagram...*\n\nMohon tunggu..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(url, "instagram");

            if (result.success && result.data.url) {
                const mediaType = result.data.type || "video";

                if (mediaType === "image") {
                    await sock.sendMessage(from, {
                        image: { url: result.data.url },
                        caption: `✅ *Instagram Image Downloaded*\n\n_Powered by ${config.botName}_`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, {
                        video: { url: result.data.url },
                        caption: `✅ *Instagram Video Downloaded*\n\n_Powered by ${config.botName}_`,
                        mimetype: "video/mp4"
                    }, { quoted: msg });
                }

                log(`Instagram downloaded: ${mediaType}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Instagram Story (Placeholder)
    if (body.startsWith(".igstory ")) {
        await sock.sendMessage(from, {
            text: "⚠️ *Feature Coming Soon!*\n\nFitur Instagram Story masih dalam pengembangan."
        }, { quoted: msg });
        return;
    }

    // Facebook Download
    if (body.startsWith(".fb ")) {
        const url = body.replace(".fb ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Downloading Facebook...*\n\nMohon tunggu..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(url, "facebook");

            if (result.success && result.data.url) {
                await sock.sendMessage(from, {
                    video: { url: result.data.url },
                    caption: `✅ *Facebook Video Downloaded*\n\n` +
                            `📌 Title: ${result.data.title || "Facebook Video"}\n\n` +
                            `_Powered by ${config.botName}_`,
                    mimetype: "video/mp4"
                }, { quoted: msg });

                log(`Facebook downloaded: ${result.data.title}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Twitter/X Download
    if (body.startsWith(".twitter ")) {
        const url = body.replace(".twitter ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Downloading Twitter...*\n\nMohon tunggu..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(url, "twitter");

            if (result.success && result.data.url) {
                const mediaType = result.data.type || "video";

                if (mediaType === "image") {
                    await sock.sendMessage(from, {
                        image: { url: result.data.url },
                        caption: `✅ *Twitter Image Downloaded*\n\n_Powered by ${config.botName}_`
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, {
                        video: { url: result.data.url },
                        caption: `✅ *Twitter Video Downloaded*\n\n_Powered by ${config.botName}_`,
                        mimetype: "video/mp4"
                    }, { quoted: msg });
                }

                log(`Twitter downloaded: ${mediaType}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Universal Download (Auto-detect)
    if (body.startsWith(".dl ")) {
        const url = body.replace(".dl ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Auto-detecting platform...*\n\nMohon tunggu..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(url, "auto");

            if (result.success && result.data.url) {
                const mediaType = result.data.type || "video";

                if (mediaType === "image") {
                    await sock.sendMessage(from, {
                        image: { url: result.data.url },
                        caption: `✅ *Media Downloaded*\n\n` +
                                `📌 Platform: ${result.data.platform || "Unknown"}\n\n` +
                                `_Powered by ${config.botName}_`
                    }, { quoted: msg });
                } else if (mediaType === "audio") {
                    await sock.sendMessage(from, {
                        audio: { url: result.data.url },
                        caption: `✅ *Audio Downloaded*\n\n` +
                                `📌 Platform: ${result.data.platform || "Unknown"}\n\n` +
                                `_Powered by ${config.botName}_`,
                        mimetype: "audio/mp4"
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, {
                        video: { url: result.data.url },
                        caption: `✅ *Video Downloaded*\n\n` +
                                `📌 Platform: ${result.data.platform || "Unknown"}\n\n` +
                                `_Powered by ${config.botName}_`,
                        mimetype: "video/mp4"
                    }, { quoted: msg });
                }

                log(`Universal download: ${result.data.platform}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Pinterest Download
    if (body.startsWith(".pinterest ")) {
        const url = body.replace(".pinterest ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Downloading Pinterest...*\n\nMohon tunggu..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(url, "pinterest");

            if (result.success && result.data.url) {
                await sock.sendMessage(from, {
                    image: { url: result.data.url },
                    caption: `✅ *Pinterest Image Downloaded*\n\n_Powered by ${config.botName}_`
                }, { quoted: msg });

                log(`Pinterest downloaded`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // SoundCloud Download
    if (body.startsWith(".soundcloud ")) {
        const url = body.replace(".soundcloud ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Downloading SoundCloud...*\n\nMohon tunggu..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(url, "soundcloud");

            if (result.success && result.data.url) {
                await sock.sendMessage(from, {
                    audio: { url: result.data.url },
                    caption: `✅ *SoundCloud Audio Downloaded*\n\n` +
                            `📌 Title: ${result.data.title || "SoundCloud Track"}\n` +
                            `👤 Artist: ${result.data.artist || "Unknown"}\n\n` +
                            `_Powered by ${config.botName}_`,
                    mimetype: "audio/mp4"
                }, { quoted: msg });

                log(`SoundCloud downloaded: ${result.data.title}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Error!*\n\n${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // MediaFire Download
    if (body.startsWith(".mediafire ")) {
        const url = body.replace(".mediafire ", "").trim();

        await sock.sendMessage(from, {
            text: "⏳ *Downloading from MediaFire...*\n\nMohon tunggu..."
        }, { quoted: msg });

        try {
            const result = await downloadFromAPI(url, "mediafire");

            if (result.success && result.data.url) {
                await sock.sendMessage(from, {
                    document: { url: result.data.url },
                    caption: `✅ *MediaFire File Downloaded*\n\n` +
                            `📌 Filename: ${result.data.filename || "file"}\n` +
                            `📦 Size: ${result.data.size || "Unknown"}\n\n` +
                            `_Powered by ${config.botName}_`,
                    mimetype: result.data.mimetype || "application/octet-stream",
                    fileName: result.data.filename || "download"
                }, { quoted: msg });

                log(`MediaFire downloaded: ${result.data.filename}`, "success");
            } else {
                await sock.sendMessage(from, {
                    text: `❌ *Download gagal!*\n\nError: ${result.message}`
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

module.exports = { handleDownloaderCommands };

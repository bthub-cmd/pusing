const fs = require("fs-extra");
const path = require("path");
const { loadConfig, loadDB, saveDB, random, log } = require("../utils/helpers");

// Store timeouts in memory, not in JSON
const activeTimeouts = new Map();

async function handleGameCommands(sock, msg, body, from) {
    const config = loadConfig();
    const sessionsDB = loadDB("game-sessions");
    const leaderboardDB = loadDB("leaderboard");
    const sender = msg.key.remoteJid;
    const senderNumber = sender.split("@")[0];

    console.log(`[GAME] Handler called with body: "${body}"`);

    // Helper to load game data
    function loadGameData(gameName) {
        const gamePath = path.join(__dirname, "..", "games", `${gameName}.json`);
        if (!fs.existsSync(gamePath)) return null;
        return fs.readJsonSync(gamePath);
    }

    // Helper to add points
    function addPoints(userNumber, points) {
        if (!leaderboardDB.users[userNumber]) {
            leaderboardDB.users[userNumber] = {
                points: 0,
                correct: 0,
                wrong: 0,
                games: 0
            };
        }

        leaderboardDB.users[userNumber].points += points;
        leaderboardDB.users[userNumber].correct += 1;
        leaderboardDB.users[userNumber].games += 1;
        saveDB("leaderboard", leaderboardDB);
    }

    // Helper to subtract points for wrong answer
    function subtractPoints(userNumber) {
        if (!leaderboardDB.users[userNumber]) {
            leaderboardDB.users[userNumber] = {
                points: 0,
                correct: 0,
                wrong: 0,
                games: 0
            };
        }

        leaderboardDB.users[userNumber].wrong += 1;
        saveDB("leaderboard", leaderboardDB);
    }

    // Check for active game answer (but skip if it's a command)
    if (sessionsDB.sessions[from] && !body.startsWith(config.prefix)) {
        const session = sessionsDB.sessions[from];
        const userAnswer = body.toLowerCase().trim();
        const correctAnswer = session.answer.toLowerCase().trim();

        if (userAnswer === correctAnswer) {
            // Correct answer
            const points = 10;
            addPoints(senderNumber, points);

            await sock.sendMessage(from, {
                text: `✅ *BENAR!*\n\n` +
                      `Jawaban: ${session.answer}\n` +
                      `+${points} poin untuk @${senderNumber}\n\n` +
                      `Total poin kamu: ${leaderboardDB.users[senderNumber].points}`,
                mentions: [sender]
            }, { quoted: msg });

            // Clear timeout from memory
            const timeout = activeTimeouts.get(from);
            if (timeout) {
                clearTimeout(timeout);
                activeTimeouts.delete(from);
            }

            // Clear session
            delete sessionsDB.sessions[from];
            saveDB("game-sessions", sessionsDB);

            log(`Game answered correctly by ${senderNumber}`, "success");
            return;
        }
    }

    // Tebak Kata
    if (body === ".tebakkata") {
        const gameData = loadGameData("tebakkata");
        if (!gameData || !gameData.questions || gameData.questions.length === 0) {
            await sock.sendMessage(from, {
                text: "❌ *Game data tidak ditemukan!*"
            }, { quoted: msg });
            return;
        }

        // Check if there's already an active game
        if (sessionsDB.sessions[from]) {
            await sock.sendMessage(from, {
                text: "⚠️ *Masih ada game yang aktif!*\n\nSelesaikan game sebelumnya terlebih dahulu."
            }, { quoted: msg });
            return;
        }

        const question = random(gameData.questions);
        
        // Create session (without timeout object)
        sessionsDB.sessions[from] = {
            game: "tebakkata",
            question: question.question,
            answer: question.answer,
            hint: question.hint,
            startTime: Date.now()
        };

        // Set timeout in memory
        const timeout = setTimeout(async () => {
            if (sessionsDB.sessions[from]) {
                await sock.sendMessage(from, {
                    text: `⏰ *WAKTU HABIS!*\n\n` +
                          `Jawaban yang benar: *${question.answer}*\n\n` +
                          `Tidak ada yang berhasil menjawab dalam ${config.gameTimeout} detik.`
                });

                delete sessionsDB.sessions[from];
                saveDB("game-sessions", sessionsDB);
                activeTimeouts.delete(from);
            }
        }, config.gameTimeout * 1000);

        activeTimeouts.set(from, timeout);
        saveDB("game-sessions", sessionsDB);

        await sock.sendMessage(from, {
            text: `🎮 *TEBAK KATA*\n\n` +
                  `${question.question}\n\n` +
                  `💡 Hint: ${question.hint}\n` +
                  `⏱️ Waktu: ${config.gameTimeout} detik\n\n` +
                  `Kirim jawaban langsung!`
        }, { quoted: msg });

        log(`Tebak Kata started in group`, "success");
        return;
    }

    // Tebak Bendera
    if (body === ".tebakbendera") {
        const gameData = loadGameData("tebakbendera");
        if (!gameData || !gameData.questions || gameData.questions.length === 0) {
            await sock.sendMessage(from, {
                text: "❌ *Game data tidak ditemukan!*"
            }, { quoted: msg });
            return;
        }

        if (sessionsDB.sessions[from]) {
            await sock.sendMessage(from, {
                text: "⚠️ *Masih ada game yang aktif!*\n\nSelesaikan game sebelumnya terlebih dahulu."
            }, { quoted: msg });
            return;
        }

        const question = random(gameData.questions);
        
        sessionsDB.sessions[from] = {
            game: "tebakbendera",
            question: question.flag,
            answer: question.country.toLowerCase(),
            hint: question.hint,
            capital: question.capital,
            startTime: Date.now()
        };

        const timeout = setTimeout(async () => {
            if (sessionsDB.sessions[from]) {
                await sock.sendMessage(from, {
                    text: `⏰ *WAKTU HABIS!*\n\n` +
                          `Bendera: ${question.flag}\n` +
                          `Jawaban: *${question.country}*\n` +
                          `Ibukota: ${question.capital}\n\n` +
                          `Tidak ada yang berhasil menjawab dalam ${config.gameTimeout} detik.`
                });

                delete sessionsDB.sessions[from];
                saveDB("game-sessions", sessionsDB);
                activeTimeouts.delete(from);
            }
        }, config.gameTimeout * 1000);

        activeTimeouts.set(from, timeout);
        saveDB("game-sessions", sessionsDB);

        await sock.sendMessage(from, {
            text: `🚩 *TEBAK BENDERA*\n\n` +
                  `${question.flag}\n\n` +
                  `Negara apa ini?\n\n` +
                  `💡 Hint: ${question.hint}\n` +
                  `⏱️ Waktu: ${config.gameTimeout} detik\n\n` +
                  `Kirim jawaban langsung!`
        }, { quoted: msg });

        log(`Tebak Bendera started in group`, "success");
        return;
    }

    // Asah Otak
    if (body === ".asahotak") {
        const gameData = loadGameData("asahotak");
        if (!gameData || !gameData.questions || gameData.questions.length === 0) {
            await sock.sendMessage(from, {
                text: "❌ *Game data tidak ditemukan!*"
            }, { quoted: msg });
            return;
        }

        if (sessionsDB.sessions[from]) {
            await sock.sendMessage(from, {
                text: "⚠️ *Masih ada game yang aktif!*\n\nSelesaikan game sebelumnya terlebih dahulu."
            }, { quoted: msg });
            return;
        }

        const question = random(gameData.questions);
        
        sessionsDB.sessions[from] = {
            game: "asahotak",
            question: question.question,
            answer: question.answer.toLowerCase(),
            hint: question.hint,
            startTime: Date.now()
        };

        const timeout = setTimeout(async () => {
            if (sessionsDB.sessions[from]) {
                await sock.sendMessage(from, {
                    text: `⏰ *WAKTU HABIS!*\n\n` +
                          `Jawaban yang benar: *${question.answer}*\n\n` +
                          `Tidak ada yang berhasil menjawab dalam ${config.gameTimeout} detik.`
                });

                delete sessionsDB.sessions[from];
                saveDB("game-sessions", sessionsDB);
                activeTimeouts.delete(from);
            }
        }, config.gameTimeout * 1000);

        activeTimeouts.set(from, timeout);
        saveDB("game-sessions", sessionsDB);

        await sock.sendMessage(from, {
            text: `🧠 *ASAH OTAK*\n\n` +
                  `${question.question}\n\n` +
                  `💡 Hint: ${question.hint}\n` +
                  `⏱️ Waktu: ${config.gameTimeout} detik\n\n` +
                  `Kirim jawaban langsung!`
        }, { quoted: msg });

        log(`Asah Otak started in group`, "success");
        return;
    }

    // Show hint
    if (body === ".hint") {
        if (!sessionsDB.sessions[from]) {
            await sock.sendMessage(from, {
                text: "❌ *Tidak ada game aktif!*"
            }, { quoted: msg });
            return;
        }

        const session = sessionsDB.sessions[from];
        await sock.sendMessage(from, {
            text: `💡 *HINT*\n\n${session.hint}`
        }, { quoted: msg });
        return;
    }

    // Leaderboard
    if (body === ".leaderboard" || body === ".lb") {
        const users = Object.entries(leaderboardDB.users)
            .sort(([, a], [, b]) => b.points - a.points)
            .slice(0, 10);

        if (users.length === 0) {
            await sock.sendMessage(from, {
                text: "📊 *LEADERBOARD*\n\nBelum ada data!"
            }, { quoted: msg });
            return;
        }

        let text = `🏆 *TOP 10 LEADERBOARD*\n\n`;
        users.forEach(([number, data], i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            text += `${medal} @${number}\n`;
            text += `   📊 ${data.points} poin | ✅ ${data.correct} | ❌ ${data.wrong}\n\n`;
        });

        await sock.sendMessage(from, {
            text: text,
            mentions: users.map(([number]) => number + "@s.whatsapp.net")
        }, { quoted: msg });

        log(`Leaderboard displayed`, "success");
        return;
    }

    // My stats
    if (body === ".mystats") {
        if (!leaderboardDB.users[senderNumber]) {
            await sock.sendMessage(from, {
                text: "📊 *STATISTIK KAMU*\n\nKamu belum pernah bermain game!"
            }, { quoted: msg });
            return;
        }

        const stats = leaderboardDB.users[senderNumber];
        const accuracy = stats.games > 0 
            ? ((stats.correct / (stats.correct + stats.wrong)) * 100).toFixed(1)
            : 0;

        await sock.sendMessage(from, {
            text: `📊 *STATISTIK @${senderNumber}*\n\n` +
                  `🏆 Total Poin: ${stats.points}\n` +
                  `🎮 Game Dimainkan: ${stats.games}\n` +
                  `✅ Benar: ${stats.correct}\n` +
                  `❌ Salah: ${stats.wrong}\n` +
                  `🎯 Akurasi: ${accuracy}%`,
            mentions: [sender]
        }, { quoted: msg });
        return;
    }
}

module.exports = { handleGameCommands };

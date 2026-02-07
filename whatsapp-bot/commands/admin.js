const { isAdmin, isBotAdmin, getMentions, toJid, log } = require("../utils/helpers");

async function handleAdminCommands(sock, msg, body, from, isGroup) {
    if (!isGroup) return;

    const sender = msg.key.participant || msg.key.remoteJid;
    
    // Check if sender is admin
    const senderIsAdmin = await isAdmin(sock, from, sender);
    if (!senderIsAdmin) {
        if (body.startsWith(".kick") || body.startsWith(".add") || 
            body.startsWith(".promote") || body.startsWith(".demote") ||
            body.startsWith(".group") || body.startsWith(".setname") ||
            body.startsWith(".setdesc") || body === ".link" ||
            body === ".tagall" || body.startsWith(".tagall") ||
            body === ".hidetag" || body.startsWith(".hidetag")) {
            await sock.sendMessage(from, {
                text: "❌ *Kamu bukan admin!*\n\nCommand ini hanya untuk admin grup."
            }, { quoted: msg });
        }
        return;
    }

    // Kick member
    if (body.startsWith(".kick")) {
        const botIsAdmin = await isBotAdmin(sock, from);
        if (!botIsAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Bot bukan admin!*\n\nJadikan bot sebagai admin untuk menggunakan fitur ini."
            }, { quoted: msg });
            return;
        }

        const mentions = getMentions(msg);
        if (mentions.length === 0) {
            await sock.sendMessage(from, {
                text: "❌ *Tag member yang ingin dikick!*\n\nContoh: .kick @user"
            }, { quoted: msg });
            return;
        }

        try {
            await sock.groupParticipantsUpdate(from, mentions, "remove");
            await sock.sendMessage(from, {
                text: `✅ *Berhasil kick ${mentions.length} member!*`
            }, { quoted: msg });
            log(`Kicked ${mentions.length} members from group`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal kick member!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Add member
    if (body.startsWith(".add ")) {
        const botIsAdmin = await isBotAdmin(sock, from);
        if (!botIsAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Bot bukan admin!*\n\nJadikan bot sebagai admin untuk menggunakan fitur ini."
            }, { quoted: msg });
            return;
        }

        const number = body.replace(".add ", "").trim();
        const jid = toJid(number);

        try {
            await sock.groupParticipantsUpdate(from, [jid], "add");
            await sock.sendMessage(from, {
                text: `✅ *Berhasil add member!*\n\nNomor: ${number}`
            }, { quoted: msg });
            log(`Added ${number} to group`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal add member!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Promote to admin
    if (body.startsWith(".promote")) {
        const botIsAdmin = await isBotAdmin(sock, from);
        if (!botIsAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Bot bukan admin!*\n\nJadikan bot sebagai admin untuk menggunakan fitur ini."
            }, { quoted: msg });
            return;
        }

        const mentions = getMentions(msg);
        if (mentions.length === 0) {
            await sock.sendMessage(from, {
                text: "❌ *Tag member yang ingin dijadikan admin!*\n\nContoh: .promote @user"
            }, { quoted: msg });
            return;
        }

        try {
            await sock.groupParticipantsUpdate(from, mentions, "promote");
            await sock.sendMessage(from, {
                text: `✅ *Berhasil promote ${mentions.length} member menjadi admin!*`
            }, { quoted: msg });
            log(`Promoted ${mentions.length} members to admin`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal promote member!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Demote admin
    if (body.startsWith(".demote")) {
        const botIsAdmin = await isBotAdmin(sock, from);
        if (!botIsAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Bot bukan admin!*\n\nJadikan bot sebagai admin untuk menggunakan fitur ini."
            }, { quoted: msg });
            return;
        }

        const mentions = getMentions(msg);
        if (mentions.length === 0) {
            await sock.sendMessage(from, {
                text: "❌ *Tag admin yang ingin diturunkan!*\n\nContoh: .demote @admin"
            }, { quoted: msg });
            return;
        }

        try {
            await sock.groupParticipantsUpdate(from, mentions, "demote");
            await sock.sendMessage(from, {
                text: `✅ *Berhasil demote ${mentions.length} admin!*`
            }, { quoted: msg });
            log(`Demoted ${mentions.length} admins`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal demote admin!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Tag all members
    if (body === ".tagall" || body.startsWith(".tagall ")) {
        const message = body.replace(".tagall", "").trim() || "Tag All!";
        
        try {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            const mentions = participants.map(p => p.id);

            let text = `${message}\n\n`;
            participants.forEach((p, i) => {
                text += `${i + 1}. @${p.id.split("@")[0]}\n`;
            });

            await sock.sendMessage(from, {
                text: text,
                mentions: mentions
            }, { quoted: msg });

            log(`Tagged all ${participants.length} members`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal tag members!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Hidden tag
    if (body === ".hidetag" || body.startsWith(".hidetag ")) {
        const message = body.replace(".hidetag", "").trim() || "Hidden Tag!";
        
        try {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            const mentions = participants.map(p => p.id);

            await sock.sendMessage(from, {
                text: message,
                mentions: mentions
            }, { quoted: msg });

            log(`Hidden tag sent to ${participants.length} members`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal hidden tag!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Group info
    if (body === ".groupinfo") {
        try {
            const groupMetadata = await sock.groupMetadata(from);
            const admins = groupMetadata.participants.filter(p => 
                p.admin === "admin" || p.admin === "superadmin"
            );

            const infoText = `📋 *GROUP INFO*\n\n` +
                `📌 Name: ${groupMetadata.subject}\n` +
                `🆔 ID: ${groupMetadata.id}\n` +
                `👥 Members: ${groupMetadata.participants.length}\n` +
                `👑 Admins: ${admins.length}\n` +
                `📝 Desc: ${groupMetadata.desc || "No description"}\n` +
                `📅 Created: ${new Date(groupMetadata.creation * 1000).toLocaleDateString()}`;

            await sock.sendMessage(from, {
                text: infoText
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal get info!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // List online members
    if (body === ".listonline") {
        try {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;

            // Note: WhatsApp doesn't provide real-time online status via API
            // This is a placeholder that lists all members
            let text = `👥 *MEMBER LIST*\n\nTotal: ${participants.length}\n\n`;
            participants.forEach((p, i) => {
                const admin = p.admin ? "👑" : "";
                text += `${i + 1}. ${admin} @${p.id.split("@")[0]}\n`;
            });

            await sock.sendMessage(from, {
                text: text,
                mentions: participants.map(p => p.id)
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal get list!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Open/Close group
    if (body.startsWith(".group ")) {
        const botIsAdmin = await isBotAdmin(sock, from);
        if (!botIsAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Bot bukan admin!*\n\nJadikan bot sebagai admin untuk menggunakan fitur ini."
            }, { quoted: msg });
            return;
        }

        const action = body.replace(".group ", "").toLowerCase();

        if (action !== "open" && action !== "close") {
            await sock.sendMessage(from, {
                text: "❌ *Action tidak valid!*\n\nGunakan: .group open atau .group close"
            }, { quoted: msg });
            return;
        }

        try {
            await sock.groupSettingUpdate(from, action === "close" ? "announcement" : "not_announcement");
            await sock.sendMessage(from, {
                text: `✅ *Grup berhasil ${action === "close" ? "ditutup" : "dibuka"}!*`
            }, { quoted: msg });
            log(`Group ${action === "close" ? "closed" : "opened"}`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal ${action} grup!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Set group name
    if (body.startsWith(".setname ")) {
        const botIsAdmin = await isBotAdmin(sock, from);
        if (!botIsAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Bot bukan admin!*\n\nJadikan bot sebagai admin untuk menggunakan fitur ini."
            }, { quoted: msg });
            return;
        }

        const name = body.replace(".setname ", "").trim();

        if (name.length > 25) {
            await sock.sendMessage(from, {
                text: "❌ *Nama terlalu panjang!*\n\nMaksimal 25 karakter."
            }, { quoted: msg });
            return;
        }

        try {
            await sock.groupUpdateSubject(from, name);
            await sock.sendMessage(from, {
                text: `✅ *Nama grup berhasil diubah!*\n\nNama baru: ${name}`
            }, { quoted: msg });
            log(`Group name changed to: ${name}`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal ubah nama!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Set group description
    if (body.startsWith(".setdesc ")) {
        const botIsAdmin = await isBotAdmin(sock, from);
        if (!botIsAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Bot bukan admin!*\n\nJadikan bot sebagai admin untuk menggunakan fitur ini."
            }, { quoted: msg });
            return;
        }

        const desc = body.replace(".setdesc ", "").trim();

        try {
            await sock.groupUpdateDescription(from, desc);
            await sock.sendMessage(from, {
                text: `✅ *Deskripsi grup berhasil diubah!*`
            }, { quoted: msg });
            log(`Group description updated`, "success");
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal ubah deskripsi!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }

    // Get invite link
    if (body === ".link") {
        const botIsAdmin = await isBotAdmin(sock, from);
        if (!botIsAdmin) {
            await sock.sendMessage(from, {
                text: "❌ *Bot bukan admin!*\n\nJadikan bot sebagai admin untuk menggunakan fitur ini."
            }, { quoted: msg });
            return;
        }

        try {
            const code = await sock.groupInviteCode(from);
            const link = `https://chat.whatsapp.com/${code}`;
            
            await sock.sendMessage(from, {
                text: `🔗 *GROUP INVITE LINK*\n\n${link}`
            }, { quoted: msg });
        } catch (error) {
            await sock.sendMessage(from, {
                text: `❌ *Gagal get link!*\n\nError: ${error.message}`
            }, { quoted: msg });
        }
        return;
    }
}

module.exports = { handleAdminCommands };

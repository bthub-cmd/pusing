# 🚀 Quick Start Guide

## Installation (5 Menit)

### 1️⃣ Upload ke VPS
```bash
# Upload folder ke VPS kamu
# Atau clone dari repository
```

### 2️⃣ Install Dependencies
```bash
cd whatsapp-bot
chmod +x install.sh
./install.sh
```

**Atau manual:**
```bash
npm install
cp .env.example .env
mkdir logs
```

### 3️⃣ Start Bot
```bash
npm start
```

### 4️⃣ Scan QR Code
Scan QR code yang muncul di terminal dengan WhatsApp kamu.

### 5️⃣ Register Owner (PENTING!)
Cari **16-digit code** di terminal:
```
========================================
  🔐 OWNER REGISTRATION CODE
========================================
  Code: Abc123XyZ456qWer
========================================
```

Kirim ke bot di WhatsApp:
```
.code Abc123XyZ456qWer
```

✅ **Done! Kamu sekarang owner bot!**

---

## Setup API Downloader

### Set API URL (Required untuk downloader)
```
.apidownload https://api.akuari.my.id
```

**Format API yang didukung:**
```json
{
  "status": true,
  "result": {
    "url": "https://direct-download-link.com",
    "title": "Title"
  }
}
```

---

## Testing Commands

### Test Admin Commands (di Grup)
1. Jadikan bot sebagai admin grup
2. Test command:
```
.groupinfo
.tagall Test
.link
```

### Test Downloader
```
.ytmp3 https://youtube.com/watch?v=xxxxx
.tiktok https://vt.tiktok.com/xxxxx
.dl https://instagram.com/p/xxxxx
```

### Test Games
```
.tebakkata
.tebakbendera
.asahotak
```

### Enable NSFW (Optional)
```
.nsfwtoggle
.nsfwmenu
```

---

## Production Setup (PM2)

### Start with PM2
```bash
npm run pm2
```

### PM2 Commands
```bash
pm2 status           # Check status
pm2 logs             # View logs
pm2 restart all      # Restart bot
pm2 stop all         # Stop bot
pm2 monit           # Monitor CPU/Memory
```

### Auto-start on Reboot
```bash
pm2 startup
pm2 save
```

---

## Common Issues

### ❌ Bot tidak connect
```bash
rm -rf session
npm start
```

### ❌ Canvas error (Linux)
```bash
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install
```

### ❌ Permission error
```bash
chmod -R 755 .
npm install
```

---

## Daily Commands Cheat Sheet

### Owner Only
```
.code <code>              # Register owner (1x only)
.apidownload <url>        # Set API downloader
.settimeout <seconds>     # Set game timeout
.nsfwtoggle              # Toggle NSFW ON/OFF
.config                  # Show config
```

### Admin (di Grup)
```
.kick @user              # Kick member
.add 628xxx             # Add member
.promote @user          # Jadikan admin
.group close            # Close group
.setname New Name       # Change name
.link                   # Get invite link
```

### Downloader
```
.ytmp4 <url>            # YouTube video
.ytmp3 <url>            # YouTube audio
.tiktok <url>           # TikTok no WM
.ig <url>               # Instagram
.dl <url>               # Auto-detect
```

### Games
```
.tebakkata              # Start game
.hint                   # Show hint
.leaderboard            # Top 10
.mystats                # Your stats
```

### General
```
.menu                   # All commands
.help                   # Same as menu
```

---

## 📊 Monitoring

### Check Logs
```bash
# PM2 logs
pm2 logs whatsapp-bot

# Or manual
tail -f logs/combined.log
```

### Check Performance
```bash
pm2 monit
```

---

## 🔧 Configuration Files

### config.json
```json
{
  "botName": "Your Bot Name",
  "prefix": ".",
  "owner": "628xxx",
  "downloaderAPI": "https://api.example.com",
  "nsfwEnabled": false,
  "gameTimeout": 30,
  "cooldownTime": 5
}
```

### Manually Edit
```bash
nano config.json
```

---

## 🎯 Next Steps

1. ✅ Bot connected
2. ✅ Owner registered
3. ✅ API downloader set
4. ✅ Test all commands
5. 🎉 Enjoy!

**Need help?** Check full README.md untuk dokumentasi lengkap!

---

**Happy Bot-ting! 🚀**

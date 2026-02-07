# 🤖 WhatsApp Bot Advanced

Bot WhatsApp multifungsi dengan fitur Admin Tools, Downloader 50+ Platform, Mini Games, dan NSFW Content.

## ✨ Features

### 👑 Owner Commands
- `.code <16digit>` - Register sebagai owner (hanya 1x)
- `.apidownload <url>` - Set API downloader
- `.settimeout <detik>` - Set timeout game (10-300 detik)
- `.nsfwtoggle` - Toggle NSFW mode ON/OFF
- `.config` - Tampilkan konfigurasi bot

### 👥 Admin Tools (Group Only)
**Member Management:**
- `.kick @user` - Kick member dari grup
- `.add <nomor>` - Add member ke grup
- `.promote @user` - Jadikan admin
- `.demote @user` - Turunkan admin
- `.tagall <pesan>` - Tag semua member
- `.hidetag <pesan>` - Hidden tag all members

**Group Settings:**
- `.group <open/close>` - Buka/tutup grup
- `.setname <nama>` - Ganti nama grup (max 25 char)
- `.setdesc <text>` - Ganti deskripsi grup
- `.link` - Dapatkan invite link
- `.groupinfo` - Info grup detail
- `.listonline` - List semua member

### 📥 Media Downloader (50+ Platform)
**YouTube:**
- `.ytmp4 <url/query>` - Download video (360p)
- `.ytmp3 <url/query>` - Download audio MP3
- `.yts <query>` - Search YouTube videos

**TikTok:**
- `.tiktok <url>` - Download video no watermark
- `.tiktokmp3 <url>` - Extract audio only

**Instagram:**
- `.ig <url>` - Download post/reel
- `.igstory <username>` - Download story (coming soon)

**Others:**
- `.fb <url>` - Facebook video
- `.twitter <url>` - Twitter/X media
- `.pinterest <url>` - Pinterest image
- `.soundcloud <url>` - SoundCloud audio
- `.mediafire <url>` - MediaFire file
- `.dl <url>` - Auto-detect platform & download

### 🎮 Mini Games
**Games:**
- `.tebakkata` - Tebak kata/kuis umum
- `.tebakbendera` - Tebak bendera negara
- `.asahotak` - Teka-teki logika

**Game Features:**
- `.hint` - Tampilkan hint
- `.leaderboard` / `.lb` - Top 10 players
- `.mystats` - Statistik pribadi

**System:**
- Timeout dapat diatur (default 30 detik)
- Point system: +10 per jawaban benar
- Leaderboard dengan tracking akurasi

### 🔞 NSFW (18+ Only)
**Random Images:**
- `.nsfw <category>` - waifu, neko, trap, blowjob, hentai
- `.waifu` - Random NSFW waifu
- `.neko` - Random NSFW neko
- `.hentai` - Random hentai
- `.trap` - Random trap

**Adult Sites Search:**
- `.xvideos <query>` - Search Xvideos
- `.xnxx <query>` - Search XNXX

**Config:**
- Master toggle via `.nsfwtoggle` (owner only)
- Cooldown 5 detik antar command
- APIs: waifu.im, nekos.life

### 🎨 Sticker Tools
- `.sticker` - Convert image to sticker
- `.toimg` - Convert sticker to image
- `.brat <text>` - Create brat style sticker

### 📋 Other Commands
- `.menu` / `.help` - Tampilkan semua command
- `.nsfwmenu` - Tampilkan NSFW commands

## 🚀 Installation

### Requirements
- Node.js 18+ 
- NPM/Yarn
- VPS/Server (recommended)

### Quick Install

```bash
# Clone atau extract project
cd whatsapp-bot

# Run install script
chmod +x install.sh
./install.sh
```

### Manual Install

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Create logs folder
mkdir logs

# Install PM2 (optional, for production)
npm install -g pm2
```

## 📝 Configuration

### 1. First Run
```bash
npm start
```

### 2. Scan QR Code
Scan QR code dengan WhatsApp kamu

### 3. Owner Registration
Bot akan generate **16-digit code** di terminal:
```
========================================
  🔐 OWNER REGISTRATION CODE
========================================
  Code: Abc123XyZ456qWer
========================================
  Gunakan command: .code <kode>
  untuk registrasi sebagai owner!
========================================
```

Kirim ke bot:
```
.code Abc123XyZ456qWer
```

**⚠️ Code hanya bisa digunakan 1x! Setelah itu akan terhapus.**

### 4. Set Downloader API
Sebagai owner, set API downloader:
```
.apidownload https://api.akuari.my.id
```

Format API response yang diharapkan:
```json
{
  "status": true,
  "result": {
    "url": "https://direct-download-link.com",
    "title": "Video Title",
    "thumbnail": "https://thumb.jpg"
  }
}
```

### 5. Toggle Features
```bash
# Aktifkan NSFW (owner only)
.nsfwtoggle

# Set game timeout (owner only)
.settimeout 45

# Check config
.config
```

## 🔧 Running Bot

### Development
```bash
npm start
```

### Production (PM2)
```bash
# Start with PM2
npm run pm2

# Or manually
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs whatsapp-bot

# Restart
pm2 restart whatsapp-bot

# Stop
pm2 stop whatsapp-bot
```

### PM2 Auto Startup
```bash
pm2 startup
pm2 save
```

## 📁 Project Structure

```
whatsapp-bot/
├── commands/
│   ├── admin.js           # Admin & group commands
│   ├── downloader.js      # Media downloader
│   ├── games.js           # Mini games
│   ├── nsfw.js            # NSFW content
│   └── owner.js           # Owner-only commands
├── database/
│   ├── cooldown.json      # Cooldown tracking
│   ├── game-sessions.json # Active game sessions
│   └── leaderboard.json   # Game leaderboard
├── games/
│   ├── asahotak.json      # 50+ brain teasers
│   ├── tebakbendera.json  # 50+ flags
│   └── tebakkata.json     # 50+ riddles
├── utils/
│   ├── helpers.js         # Utility functions
│   └── scrapers.js        # NSFW scrapers
├── session/               # WhatsApp auth (auto-generated)
├── logs/                  # PM2 logs
├── config.json            # Bot configuration
├── auth-code.txt          # Owner code (auto-generated, 1x use)
├── package.json           # Dependencies
├── ecosystem.config.js    # PM2 config
├── .env.example           # Environment template
├── install.sh             # Installation script
├── index.js               # Main bot file
└── README.md              # This file
```

## 🔒 Security Notes

1. **Owner Code**: 
   - Generated otomatis saat first run
   - Hanya bisa digunakan 1x
   - Terhapus setelah registrasi

2. **NSFW Content**:
   - Disabled by default
   - Hanya owner yang bisa toggle
   - Gunakan dengan bijak (18+)

3. **API Keys**:
   - Jangan share API URL ke public
   - Gunakan API dengan rate limiting

4. **Session Folder**:
   - Jangan share session folder
   - Berisi auth WhatsApp kamu

## 🐛 Troubleshooting

### Bot tidak connect
```bash
# Hapus session dan scan ulang
rm -rf session
npm start
```

### Dependencies error
```bash
# Clear cache dan reinstall
rm -rf node_modules package-lock.json
npm install
```

### PM2 not working
```bash
# Install PM2 global
sudo npm install -g pm2

# Or use without PM2
npm start
```

### Canvas error (Linux)
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

## 📊 API Integration

### Downloader API Format
Endpoint: `{API_URL}/download?url={user_url}&type={type}`

Response:
```json
{
  "status": true,
  "result": {
    "url": "https://direct-link.com/file.mp4",
    "title": "Video Title",
    "thumbnail": "https://thumb.jpg",
    "type": "video",
    "platform": "youtube"
  }
}
```

### Search API Format
Endpoint: `{API_URL}/search?query={query}&platform={platform}`

Response:
```json
{
  "status": true,
  "result": [
    {
      "title": "Video Title",
      "url": "https://youtube.com/watch?v=xxx",
      "duration": "3:45",
      "views": "1M"
    }
  ]
}
```

## 🤝 Contributing

Feel free to:
- Report bugs
- Suggest features
- Improve code
- Add more games

## 📄 License

MIT License - feel free to use and modify!

## ⚠️ Disclaimer

- Bot ini untuk edukasi dan personal use
- NSFW content hanya untuk 18+
- Tidak bertanggung jawab atas penyalahgunaan
- Gunakan dengan bijak dan ikuti ToS WhatsApp

## 🎉 Credits

- **Baileys** - WhatsApp Web API
- **waifu.im** - NSFW API
- **nekos.life** - NSFW API
- **akuari.my.id** - Downloader API (example)

---

**Made with ❤️ by Bot Developers**

Enjoy using WhatsApp Bot Advanced! 🚀

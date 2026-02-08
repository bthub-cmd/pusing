# 🔄 Changelog - WhatsApp Bot v2.0

## 🎉 Version 2.0 - Major Update

**Release Date:** February 8, 2026

---

## ❌ **BUG FIXES:**

### 1. ✅ Fixed `.toimg` Command
**Problem:** Sticker to image conversion tidak bekerja
**Solution:** 
- Added proper error handling
- Improved WebP to PNG conversion with sharp
- Added success message with caption

### 2. ✅ Fixed Admin Bot Check
**Problem:** Bot selalu error "bot bukan admin" meskipun sudah admin
**Solution:**
- Fixed `isBotAdmin()` function
- Properly extract bot JID: `sock.user.id.split(':')[0] + "@s.whatsapp.net"`
- Added error logging for debugging

### 3. ✅ Fixed Games Timeout Error
**Problem:** Circular JSON structure error saat save game session
**Solution:**
- Timeout objects tidak disimpan di JSON
- Menggunakan `Map()` untuk store timeouts in memory
- Properly clear timeout saat game selesai

### 4. ✅ Fixed Code Generator Display
**Problem:** Owner registration code tidak muncul di terminal
**Solution:**
- Force display code jika owner belum register
- Read existing code jika file sudah ada
- Display code setiap kali bot start (sampai owner register)

---

## ✨ **NEW FEATURES:**

### 1. 🎨 Interactive Menu Button
**Feature:** Menu dengan button interaktif
- Banner custom "Aphrodite by Franza"
- 1 Button "📋 Lihat Semua Menu"
- Klik button → Interactive list dengan sections
- Sections: Owner, Admin, Downloader, Games, Sticker, NSFW
- Owner commands hanya muncul untuk owner
- Downloader section hide jika API belum set

**Commands:**
- `.menu` atau `.help` → Show menu

### 2. 👑 Banner Customization System
**Feature:** Owner bisa customize banner menu

**Commands:**
- `.setbanner <text>` - Set banner title
- `.setsubtitle <text>` - Set banner subtitle
- `.setdesc <text>` - Set banner description
- `.setbannerimg` (reply to image) - Set banner image
- `.removebannerimg` - Remove banner image
- `.previewbanner` - Preview banner
- `.resetbanner` - Reset to default

**Default Banner:**
```
🌸 Aphrodite Bot 🌸
by Franza

Halo! Aku adalah bot multifungsi 
untuk membantu kamu di grup.

⚠️ Educational Purpose Only
```

### 3. 🎨 Brat Sticker Color Presets
**Feature:** 5 color presets untuk brat sticker

**Commands:**
- `.brat <text>` - White/Black (NEW DEFAULT)
- `.brat green <text>` - Green/Black (original)
- `.brat pink <text>` - Pink/White
- `.brat blue <text>` - Blue/White
- `.brat dark <text>` - Black/White

**Size:** All stickers now 512x512 pixel (perfect quality)

### 4. 📏 Sticker Size Fix
**Feature:** All stickers output 512x512 pixel
- `.sticker` - Proper resize with fit: contain
- `.brat` - All presets 512x512
- `.toimg` - Maintain quality

### 5. ⏳ Cooldown Reply System
**Feature:** Better cooldown handling
- User gets cooldown message
- After cooldown, bot replies to original message
- Skip cooldown for: `.code`, `.menu`, `.help`
- Smooth UX experience

---

## 🔧 **IMPROVEMENTS:**

### Menu System
- ✅ Conditional sections (owner, downloader, nsfw)
- ✅ Interactive list dengan categories
- ✅ Clean formatting dengan spacing
- ✅ Educational disclaimer
- ✅ Custom banner support

### Sticker Tools
- ✅ All 512x512 pixel output
- ✅ 5 color presets
- ✅ Better error handling
- ✅ Success messages

### Games
- ✅ No more circular JSON errors
- ✅ Proper timeout management
- ✅ Memory-based timeout storage
- ✅ Clean session management

### Admin Tools
- ✅ Fixed bot admin detection
- ✅ Better error messages
- ✅ Proper JID handling

---

## 📋 **COMMAND SUMMARY:**

### New Commands (v2.0):
```
👑 OWNER - Banner Customization:
├ .setbanner <text>
├ .setsubtitle <text>
├ .setdesc <text>
├ .setbannerimg (reply img)
├ .removebannerimg
├ .previewbanner
└ .resetbanner

🎨 STICKER - Brat Presets:
├ .brat <text>
├ .brat green <text>
├ .brat pink <text>
├ .brat blue <text>
└ .brat dark <text>
```

### Fixed Commands:
```
✅ .toimg - Now working properly
✅ .sticker - 512x512 output
✅ All admin commands - Bot check fixed
✅ All game commands - No JSON errors
```

---

## 🎯 **MIGRATION GUIDE:**

### From v1.0 to v2.0:

1. **Extract new ZIP**
2. **Backup your old session folder** (if you want to keep same WhatsApp)
3. **Copy session folder** to new directory
4. **Run:** `npm install` (new dependencies)
5. **Start bot:** `npm start`
6. **Register owner** if not done yet (code will show)
7. **Customize banner** (optional): `.setbanner`, `.setsubtitle`, etc.

### Config.json Changes:
New field added:
```json
{
  "banner": {
    "title": "🌸 Aphrodite Bot 🌸",
    "subtitle": "by Franza",
    "description": "...",
    "disclaimer": "⚠️ Educational Purpose Only",
    "image": null,
    "enabled": true
  }
}
```

---

## 🐛 **KNOWN ISSUES (Fixed):**

- ❌ ~~`.toimg` not working~~ → ✅ FIXED
- ❌ ~~Admin bot check error~~ → ✅ FIXED
- ❌ ~~Games circular JSON~~ → ✅ FIXED
- ❌ ~~Code generator not showing~~ → ✅ FIXED
- ❌ ~~Brat only green color~~ → ✅ FIXED (5 presets)
- ❌ ~~Sticker wrong size~~ → ✅ FIXED (512x512)

---

## 📊 **Statistics:**

- **Lines of Code:** 3,000+ (from 2,500+)
- **New Commands:** 12
- **Fixed Bugs:** 4 critical
- **New Features:** 5 major
- **Color Presets:** 5
- **Menu Sections:** Up to 6 (dynamic)

---

## 🎉 **What's Next:**

Future updates may include:
- [ ] Database migration to SQLite
- [ ] Multi-language support
- [ ] Auto-reply system
- [ ] Scheduled messages
- [ ] AI chat integration
- [ ] More game modes
- [ ] Custom sticker packs

---

## 📞 **Support:**

- Read **README.md** for full documentation
- Read **QUICKSTART.md** for 5-minute setup
- Read **API_SETUP.md** for API configuration

---

**Developed with ❤️ - Now with 100% bug fixes!** 🚀

Enjoy WhatsApp Bot v2.0 - Aphrodite Edition! 🌸

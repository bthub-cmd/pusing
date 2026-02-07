# 🔌 API Setup Guide

## Downloader API Configuration

Bot ini membutuhkan API eksternal untuk fitur downloader. Berikut cara setupnya:

---

## 📋 API Requirements

### Endpoint Format
```
GET {API_URL}/download?url={user_url}&type={type}
```

### Response Format (Required)
```json
{
  "status": true,
  "result": {
    "url": "https://direct-download-link.com/file.mp4",
    "title": "Video Title",
    "thumbnail": "https://thumbnail.jpg",
    "type": "video",
    "platform": "youtube"
  }
}
```

**Error Response:**
```json
{
  "status": false,
  "message": "Error description"
}
```

---

## 🌐 Free API Options

### 1. akuari.my.id (Recommended)
```
https://api.akuari.my.id
```

**Features:**
- YouTube, TikTok, Instagram, Facebook
- No API key required
- Free tier available

**Setup:**
```
.apidownload https://api.akuari.my.id
```

### 2. Build Your Own API
Deploy API sendiri menggunakan:
- `ytdl-core` untuk YouTube
- `@xaviabot/fdown` untuk TikTok/FB/IG
- Express.js server

---

## 🛠️ Custom API Example

### Simple Express API
```javascript
const express = require('express');
const ytdl = require('ytdl-core');
const app = express();

app.get('/download', async (req, res) => {
  try {
    const { url, type } = req.query;
    
    if (type === 'ytmp3') {
      const info = await ytdl.getInfo(url);
      const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
      
      return res.json({
        status: true,
        result: {
          url: format.url,
          title: info.videoDetails.title,
          type: 'audio'
        }
      });
    }
    
    // Handle other types...
    
  } catch (error) {
    res.json({
      status: false,
      message: error.message
    });
  }
});

app.listen(3000);
```

---

## 📝 Supported Download Types

Bot akan mengirim parameter `type` sesuai command:

| Command | Type Parameter |
|---------|---------------|
| `.ytmp4` | `ytmp4` |
| `.ytmp3` | `ytmp3` |
| `.tiktok` | `tiktok` |
| `.tiktokmp3` | `tiktokmp3` |
| `.ig` | `instagram` |
| `.fb` | `facebook` |
| `.twitter` | `twitter` |
| `.pinterest` | `pinterest` |
| `.soundcloud` | `soundcloud` |
| `.mediafire` | `mediafire` |
| `.dl` | `auto` |

---

## 🔍 Testing API

### Test dengan cURL
```bash
curl "https://api.akuari.my.id/download?url=https://youtube.com/watch?v=xxxxx&type=ytmp3"
```

### Expected Response
```json
{
  "status": true,
  "result": {
    "url": "https://direct-link.com/audio.mp3",
    "title": "Song Title"
  }
}
```

---

## 🚀 Advanced: YouTube Search API

### Search Endpoint (Optional)
```
GET {API_URL}/search?query={query}&platform={platform}
```

### Response Format
```json
{
  "status": true,
  "result": [
    {
      "title": "Video Title",
      "url": "https://youtube.com/watch?v=xxxxx",
      "duration": "3:45",
      "views": "1M views"
    }
  ]
}
```

**Used by:** `.yts` command

---

## ⚙️ Configuration

### Set API via Command
```
.apidownload https://your-api-url.com
```

### Manual Edit config.json
```json
{
  "downloaderAPI": "https://your-api-url.com"
}
```

### Verify Configuration
```
.config
```

---

## 🔒 Security Tips

1. **Use HTTPS**: Always use secure API endpoints
2. **Rate Limiting**: Implement rate limits on your API
3. **API Keys**: Consider using authentication
4. **CORS**: Configure CORS properly if hosting yourself
5. **Error Handling**: Return proper error messages

---

## 📊 API Response Examples

### YouTube MP4
```json
{
  "status": true,
  "result": {
    "url": "https://example.com/video.mp4",
    "title": "Amazing Video",
    "thumbnail": "https://example.com/thumb.jpg",
    "type": "video",
    "platform": "youtube"
  }
}
```

### TikTok
```json
{
  "status": true,
  "result": {
    "url": "https://example.com/tiktok.mp4",
    "title": "TikTok Video",
    "author": "@username",
    "type": "video",
    "platform": "tiktok"
  }
}
```

### Instagram
```json
{
  "status": true,
  "result": {
    "url": "https://example.com/ig.mp4",
    "type": "video",
    "platform": "instagram"
  }
}
```

### MediaFire
```json
{
  "status": true,
  "result": {
    "url": "https://example.com/file.zip",
    "filename": "document.zip",
    "size": "25.5 MB",
    "mimetype": "application/zip"
  }
}
```

---

## 🐛 Troubleshooting

### API Not Set
```
❌ Downloader API belum diset!
```
**Solution:** Set API dengan `.apidownload <url>`

### API Error
```
❌ Download gagal! Error: [message]
```
**Check:**
1. API URL benar?
2. API online?
3. URL yang di-download valid?
4. Response format sesuai?

### Timeout
```
❌ Error! timeout of 60000ms exceeded
```
**Solution:**
- API terlalu lambat
- Gunakan API yang lebih cepat
- Increase timeout di code (optional)

---

## 📞 Support

Jika API tidak bekerja:
1. Test API dengan cURL
2. Check response format
3. Verify error messages
4. Contact API provider

---

## 🎯 Recommended Setup

**For Personal Use:**
```
Free API: https://api.akuari.my.id
```

**For Production:**
- Build own API server
- Use dedicated VPS
- Implement caching
- Add rate limiting

---

**Need Help?** Check main README.md atau contact developer!

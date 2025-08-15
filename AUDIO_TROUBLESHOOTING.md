# 🔧 Audio Player Troubleshooting Guide

## 🚨 Common Issues & Solutions

### **1. Audio Not Playing (Most Common)**

#### **Browser Autoplay Policy**
- **Problem**: Modern browsers block autoplay by default
- **Solution**: Click the play button manually (this is normal!)
- **Why**: Browsers require user interaction before playing audio

#### **File Path Issues**
- **Problem**: Audio files not found
- **Solution**: Check file structure:
  ```
  your-project/
  ├── public/
  │   └── audio/
  │       ├── epic-battle.mp3
  │       ├── strategic-warfare.mp3
  │       └── victory-march.mp3
  ```

#### **File Format Issues**
- **Problem**: Unsupported audio format
- **Solution**: Use MP3 files (most compatible)
- **Alternative**: Convert to MP3 using online converters

### **2. Check Console for Errors**

Open browser console (F12) and look for:
- ✅ `Testing audio files...`
- ✅ `epic-battle.mp3: Found`
- ❌ `epic-battle.mp3: Not found (404)`
- ❌ `epic-battle.mp3: Error - ...`

### **3. File Verification Steps**

#### **Step 1: Check File Structure**
```bash
# In your project root
ls -la public/audio/
# Should show:
# epic-battle.mp3
# strategic-warfare.mp3
# victory-march.mp3
```

#### **Step 2: Check File Permissions**
```bash
# Make sure files are readable
chmod 644 public/audio/*.mp3
```

#### **Step 3: Test Direct URL**
Visit these URLs in your browser:
- `http://localhost:3000/audio/epic-battle.mp3`
- `http://localhost:3000/audio/strategic-warfare.mp3`
- `http://localhost:3000/audio/victory-march.mp3`

### **4. Browser-Specific Issues**

#### **Chrome/Edge**
- Check if audio is muted in browser
- Look for audio icon in tab (🔇)
- Check site permissions

#### **Firefox**
- Check autoplay settings
- Look for audio controls in address bar

#### **Safari**
- Check autoplay settings
- May require user interaction

### **5. Quick Fixes**

#### **Fix 1: Restart Development Server**
```bash
# Stop server (Ctrl+C)
# Restart
npm run dev
# or
yarn dev
```

#### **Fix 2: Clear Browser Cache**
- Hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
- Clear browser cache and cookies

#### **Fix 3: Check File Names**
- Ensure exact spelling: `epic-battle.mp3` (not `Epic-Battle.mp3`)
- No spaces in filenames
- Use lowercase with hyphens

### **6. Test with Sample Audio**

#### **Option 1: Use Online Audio**
Temporarily change URLs to test:
```tsx
const soundtrack = [
  {
    title: "Test Track",
    artist: "Test Artist",
    url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav",
    duration: "0:05"
  }
]
```

#### **Option 2: Create Test Audio**
Use online tools to create simple test MP3s:
- [Online Audio Converter](https://online-audio-converter.com/)
- [Audacity](https://www.audacityteam.org/) (free software)

### **7. Debug Panel Information**

The player now shows:
- **Track number** (e.g., "Track: 1/3")
- **Play status** (Playing/Paused)
- **Volume level** (e.g., "Volume: 70%")

### **8. Still Not Working?**

#### **Check These:**
1. ✅ Files exist in `public/audio/` folder
2. ✅ File names match exactly
3. ✅ Files are valid MP3s
4. ✅ Development server is running
5. ✅ Browser console shows no errors
6. ✅ User has clicked play button (required)

#### **Last Resort:**
Replace audio element with simple test:
```tsx
<audio controls>
  <source src="/audio/epic-battle.mp3" type="audio/mpeg" />
  Your browser does not support audio.
</audio>
```

---

## 🎯 **Most Likely Solution:**

**The audio files are probably not in the right location.** Make sure you have:

1. **Created the folder**: `public/audio/`
2. **Placed MP3 files** in that folder
3. **Named files exactly**: `epic-battle.mp3`, `strategic-warfare.mp3`, `victory-march.mp3`
4. **Restarted your dev server**

Check the browser console for the file testing results! 🎵

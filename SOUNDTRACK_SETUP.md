# 🎵 Soundtrack Setup for ZeroSum Gaming

## Overview
Your home page now has a beautiful soundtrack player with full controls! The player includes:
- **Play/Pause** functionality
- **Previous/Next** track navigation
- **Volume control** with slider
- **Mute/Unmute** toggle
- **Track information** display
- **Auto-play next track** when current track ends

## 🎧 Audio Files Needed

Create a `public/audio/` folder in your project and add these audio files:

### Required Files:
1. **`public/audio/epic-battle.mp3`** - Epic battle theme music
2. **`public/audio/strategic-warfare.mp3`** - Strategic gameplay music  
3. **`public/audio/victory-march.mp3`** - Victory celebration music

### Recommended Audio Specifications:
- **Format**: MP3 (widely supported)
- **Bitrate**: 128-320 kbps
- **Duration**: 2-5 minutes per track
- **Style**: Epic, gaming, electronic, orchestral

## 🎮 How It Works

### Features:
- **Fixed Position**: Player stays in top-right corner
- **Backdrop Blur**: Modern glass-morphism design
- **Responsive**: Works on all screen sizes
- **Auto-advance**: Automatically plays next track
- **Volume Memory**: Remembers user's volume preference

### Controls:
- **Play Button**: ▶️ Play/Pause with spinning animation
- **Skip Buttons**: ⏮️ Previous / ⏭️ Next track
- **Volume Slider**: Custom styled with cyan accent
- **Mute Button**: 🔇 Toggle mute/unmute

## 🎨 Customization

### Change Track List:
Edit the `soundtrack` array in `app/page.tsx`:

```tsx
const soundtrack = [
  {
    title: "Your Track Title",
    artist: "Your Artist Name",
    url: "/audio/your-file.mp3",
    duration: "3:45"
  },
  // Add more tracks...
]
```

### Change Player Position:
Modify the CSS classes in the soundtrack controls div:
- `top-24` - Distance from top
- `right-6` - Distance from right
- `z-40` - Z-index layer

### Change Player Style:
Modify the background, border, and shadow classes in the player container.

## 🚀 Getting Started

1. **Create the audio folder**: `mkdir public/audio`
2. **Add your MP3 files** to the folder
3. **Update track information** in the code if needed
4. **Test the player** on your home page

## 💡 Tips

- **Use royalty-free music** or music you have rights to
- **Keep file sizes reasonable** (under 5MB per track)
- **Test on different devices** to ensure compatibility
- **Consider adding more tracks** for variety
- **Match music style** to your game's theme

## 🔧 Troubleshooting

### Audio Not Playing:
- Check file paths are correct
- Ensure audio files are valid MP3s
- Check browser console for errors
- Verify files are in `public/audio/` folder

### Player Not Visible:
- Check z-index values
- Ensure no other elements are covering it
- Verify CSS classes are applied correctly

### Volume Issues:
- Check browser volume settings
- Ensure audio element is properly referenced
- Verify volume state management

---

**Enjoy your epic gaming soundtrack! 🎮🎵**

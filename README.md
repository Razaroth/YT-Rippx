# YTRippx - YouTube Downloader

A modern desktop application and CLI tool to download YouTube videos as MP3 or MP4 files with quality selection, playlist support, and download history tracking.

## Features

✨ **Core Features:**
- Download YouTube videos as MP3 (audio) or MP4 (video)
- Quality selection (Best, 720p, 480p, 360p, 144p)
- Playlist support
- Download queue management
- Video thumbnail preview
- Download history tracking
- Persistent download history with SQLite

🎨 **Interface:**
- Modern desktop GUI built with Electron
- Command-line interface for automation
- Real-time download progress
- Video information preview

## Installation

### Prerequisites
- Node.js 14+ and npm
- Python 3.8+ (for yt-dlp)
- yt-dlp installed: `pip install yt-dlp`

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ytrippx
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Usage

### Desktop Application

Start the desktop app:
```bash
npm start
```

Or in development mode with hot reload:
```bash
npm run dev
```

### Command-Line Interface

Download a single video:
```bash
npm run cli download "https://www.youtube.com/watch?v=..." --format mp3 --quality best --output "./downloads"
```

Get video information:
```bash
npm run cli info "https://www.youtube.com/watch?v=..."
```

#### CLI Options

**download** command:
- `--format, -f`: Output format (`mp3` or `mp4`, default: `mp4`)
- `--quality, -q`: Quality (`best`, `720p`, `480p`, `360p`, `144p`, default: `best`)
- `--output, -o`: Output directory (default: `~/Downloads/YTRippx`)

**info** command:
- Displays video title, duration, uploader, and available formats

## Project Structure

```
ytrippx/
├── src/
│   ├── main/
│   │   ├── index.js          # Main Electron process
│   │   └── preload.js        # IPC bridge
│   ├── renderer/             # Renderer process (UI)
│   ├── services/
│   │   ├── youtubeService.js # Download logic
│   │   ├── historyService.js # Database management
│   │   └── formatsService.js # Format extraction
│   └── cli/
│       └── ytripper-cli.js   # CLI interface
├── public/
│   ├── index.html            # Main HTML
│   ├── styles.css            # Styling
│   └── app.js                # Renderer logic
├── assets/                   # App icons
└── package.json              # Dependencies
```

## Building & Packaging

### For Development
```bash
npm run electron-dev
```

### For Production
```bash
npm run make
```

This creates Windows installers and portable executables in the `out/` directory.

## API Reference

### IPC Events (Main ↔ Renderer)

**download** - Download a video
```javascript
await window.electronAPI.download({
  url: string,
  format: 'mp3' | 'mp4',
  quality: string,
  outputPath: string
})
```

**getFormats** - Get available formats for a URL
```javascript
await window.electronAPI.getFormats(url)
```

**getHistory** - Retrieve download history
```javascript
await window.electronAPI.getHistory()
```

**clearHistory** - Clear all download history
```javascript
await window.electronAPI.clearHistory()
```

**selectDirectory** - Open directory picker
```javascript
await window.electronAPI.selectDirectory()
```

## Troubleshooting

### yt-dlp not found
Ensure yt-dlp is installed and in your PATH:
```bash
pip install --upgrade yt-dlp
```

### Download fails
- Check your internet connection
- Verify the YouTube URL is valid and not age-restricted
- Ensure you have write permissions to the output directory

### GUI doesn't appear
- In development, check the DevTools console for errors
- Ensure Node.js and Electron dependencies are properly installed

## Technologies Used

- **Electron** - Desktop framework
- **Node.js** - Backend runtime
- **yt-dlp** - YouTube downloader
- **SQLite3** - Local database
- **yargs** - CLI framework
- **Express** - (Optional) for future API features

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## Roadmap

- [ ] Playlist download support
- [ ] Download queue with pause/resume
- [ ] Subtitle downloading
- [ ] Built-in format converter
- [ ] Batch downloads
- [ ] Settings/preferences panel
- [ ] Auto-update functionality

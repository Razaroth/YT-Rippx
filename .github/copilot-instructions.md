# YTRippx - Copilot Instructions

## Project Overview
YTRippx is a desktop and CLI application for downloading YouTube videos in MP3 and MP4 formats with advanced features like quality selection, playlist support, and download history tracking.

## Technology Stack
- **Frontend**: Electron + JavaScript + CSS
- **Backend**: Node.js
- **Database**: SQLite3
- **CLI**: yargs
- **Video Processing**: yt-dlp

## Key Files
- `src/main/index.js` - Main Electron process and IPC handlers
- `src/main/preload.js` - Secure IPC bridge
- `public/app.js` - GUI renderer logic
- `src/services/youtubeService.js` - YouTube download implementation
- `src/services/historyService.js` - Database/history management
- `src/cli/ytripper-cli.js` - Command-line interface

## Development Guidelines

### Adding Features
1. Update service files in `src/services/` for backend logic
2. Add IPC handlers in `src/main/index.js`
3. Expose via preload in `src/main/preload.js`
4. Call from `public/app.js` in the renderer

### Adding CLI Commands
Edit `src/cli/ytripper-cli.js` and add commands using yargs

### Styling
Modify `public/styles.css` for UI changes

## Common Tasks

### Testing
- Desktop: `npm start`
- CLI: `npm run cli <command>`

### Building
- Development: `npm run dev`
- Production: `npm run make`

### Dependencies
- Install: `npm install <package>`
- Update yt-dlp: `pip install --upgrade yt-dlp`

## Code Style
- Use async/await for promises
- Keep service functions modular
- Include error handling in all IPC handlers
- Use meaningful variable names

## Important Notes
- yt-dlp must be installed separately via pip
- Database auto-initializes on first run
- All downloads default to `~/Downloads/YTRippx`
- Context isolation is enabled for security

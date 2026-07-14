const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const os = require('os');

const execPromise = promisify(exec);

// Resolve the yt-dlp executable path, checking PATH and common install locations
let _ytDlpPath = null;
async function resolveYtDlp() {
  if (_ytDlpPath) return _ytDlpPath;

  // 1. Try the system PATH first (where / which)
  try {
    const cmd = process.platform === 'win32' ? 'where yt-dlp' : 'which yt-dlp';
    const { stdout } = await execPromise(cmd);
    const found = stdout.trim().split(/\r?\n/)[0];
    if (found && fs.existsSync(found)) {
      _ytDlpPath = `"${found}"`;
      return _ytDlpPath;
    }
  } catch (_) { /* not in PATH */ }

  // 2. Common Windows locations (pip install / standalone binary)
  if (process.platform === 'win32') {
    const candidates = [];
    const localAppData = process.env.LOCALAPPDATA || '';
    const appData = process.env.APPDATA || '';
    const userProfile = process.env.USERPROFILE || os.homedir();

    // Python pip Scripts directories
    for (const base of [localAppData, appData]) {
      if (!base) continue;
      // e.g. %LOCALAPPDATA%\Programs\Python\Python3XX\Scripts\yt-dlp.exe
      try {
        const pyDir = path.join(base, 'Programs', 'Python');
        if (fs.existsSync(pyDir)) {
          for (const ver of fs.readdirSync(pyDir)) {
            candidates.push(path.join(pyDir, ver, 'Scripts', 'yt-dlp.exe'));
          }
        }
      } catch (_) {}
      // e.g. %APPDATA%\Python\PythonXX\Scripts\yt-dlp.exe
      try {
        const pyDir = path.join(base, 'Python');
        if (fs.existsSync(pyDir)) {
          for (const ver of fs.readdirSync(pyDir)) {
            candidates.push(path.join(pyDir, ver, 'Scripts', 'yt-dlp.exe'));
          }
        }
      } catch (_) {}
    }

    // Scoop, Chocolatey, standalone in %USERPROFILE%
    candidates.push(
      path.join(userProfile, 'scoop', 'shims', 'yt-dlp.exe'),
      path.join(userProfile, 'scoop', 'apps', 'yt-dlp', 'current', 'yt-dlp.exe'),
      'C:\\ProgramData\\chocolatey\\bin\\yt-dlp.exe',
      path.join(userProfile, 'bin', 'yt-dlp.exe'),
      path.join(userProfile, 'Downloads', 'yt-dlp.exe'),
    );

    // System-wide Python installs
    for (const drive of ['C:', 'D:']) {
      for (const ver of ['312', '311', '310', '39', '38']) {
        candidates.push(`${drive}\\Python${ver}\\Scripts\\yt-dlp.exe`);
      }
    }

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        _ytDlpPath = `"${c}"`;
        return _ytDlpPath;
      }
    }
  }

  // 3. macOS / Linux fallback locations
  const unixCandidates = [
    '/usr/local/bin/yt-dlp',
    '/usr/bin/yt-dlp',
    path.join(os.homedir(), '.local', 'bin', 'yt-dlp'),
    path.join(os.homedir(), 'bin', 'yt-dlp'),
  ];
  for (const c of unixCandidates) {
    if (fs.existsSync(c)) {
      _ytDlpPath = c;
      return _ytDlpPath;
    }
  }

  throw new Error(
    'yt-dlp not found. Please install it:\n' +
    '  Windows: pip install yt-dlp  (or download yt-dlp.exe and add to PATH)\n' +
    '  macOS/Linux: pip install yt-dlp  or  brew install yt-dlp'
  );
}

// Resolve ffmpeg executable path (needed for MP3 conversion and format merging)
let _ffmpegPath = null;
async function resolveFFmpeg() {
  if (_ffmpegPath !== null) return _ffmpegPath; // null = not found (cached)

  // 1. System PATH
  try {
    const cmd = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
    const { stdout } = await execPromise(cmd);
    const found = stdout.trim().split(/\r?\n/)[0];
    if (found && fs.existsSync(found)) {
      _ffmpegPath = found;
      return _ffmpegPath;
    }
  } catch (_) {}

  if (process.platform === 'win32') {
    const userProfile = process.env.USERPROFILE || os.homedir();
    const localAppData = process.env.LOCALAPPDATA || '';
    const candidates = [
      path.join(userProfile, 'scoop', 'shims', 'ffmpeg.exe'),
      path.join(userProfile, 'scoop', 'apps', 'ffmpeg', 'current', 'bin', 'ffmpeg.exe'),
      'C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe',
      'C:\\ffmpeg\\bin\\ffmpeg.exe',
      'C:\\ffmpeg\\ffmpeg.exe',
      path.join(userProfile, 'ffmpeg', 'bin', 'ffmpeg.exe'),
      path.join(localAppData, 'Programs', 'ffmpeg', 'bin', 'ffmpeg.exe'),
      path.join(userProfile, 'bin', 'ffmpeg.exe'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) { _ffmpegPath = c; return _ffmpegPath; }
    }
  } else {
    const unixCandidates = [
      '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg',
      path.join(os.homedir(), '.local', 'bin', 'ffmpeg'),
    ];
    for (const c of unixCandidates) {
      if (fs.existsSync(c)) { _ffmpegPath = c; return _ffmpegPath; }
    }
  }

  _ffmpegPath = ''; // cache miss — not found
  return _ffmpegPath;
}

// Resolve aria2c — fastest external downloader (splits each fragment into 16 parallel range-requests)
let _aria2cPath = null;
async function resolveAria2c() {
  if (_aria2cPath !== null) return _aria2cPath;

  try {
    const cmd = process.platform === 'win32' ? 'where aria2c' : 'which aria2c';
    const { stdout } = await execPromise(cmd);
    const found = stdout.trim().split(/\r?\n/)[0];
    if (found && fs.existsSync(found)) { _aria2cPath = found; return _aria2cPath; }
  } catch (_) {}

  if (process.platform === 'win32') {
    const userProfile = process.env.USERPROFILE || os.homedir();
    const candidates = [
      path.join(userProfile, 'scoop', 'shims', 'aria2c.exe'),
      path.join(userProfile, 'scoop', 'apps', 'aria2', 'current', 'aria2c.exe'),
      'C:\\ProgramData\\chocolatey\\bin\\aria2c.exe',
      path.join(userProfile, 'bin', 'aria2c.exe'),
      'C:\\aria2\\aria2c.exe',
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) { _aria2cPath = c; return _aria2cPath; }
    }
  } else {
    for (const c of ['/usr/local/bin/aria2c', '/usr/bin/aria2c', path.join(os.homedir(), '.local', 'bin', 'aria2c')]) {
      if (fs.existsSync(c)) { _aria2cPath = c; return _aria2cPath; }
    }
  }

  _aria2cPath = ''; // not found
  return _aria2cPath;
}

// Extract only ERROR lines from yt-dlp stderr (ignore WARNING / INFO noise)
function extractErrors(stderr) {
  if (!stderr) return '';
  const errorLines = stderr
    .split(/\r?\n/)
    .filter(l => /^\s*ERROR:/i.test(l))
    .join('\n');
  return errorLines || stderr.trim();
}

// Download YouTube video/audio
async function downloadYouTube(url, format, quality, outputPath, onProgress, threads = 4) {
  return new Promise(async (resolve, reject) => {
    let ytDlp;
    try { ytDlp = await resolveYtDlp(); } catch (e) { return reject(e); }

    const ffmpegPath = await resolveFFmpeg();

    const defaultPath = outputPath || path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'YTRippx');

    // Ensure output directory exists
    if (!fs.existsSync(defaultPath)) {
      fs.mkdirSync(defaultPath, { recursive: true });
    }

    if (format === 'mp3' && !ffmpegPath) {
      return reject(new Error(
        'ffmpeg is required for MP3 conversion but was not found.\n' +
        'Install it and try again:\n' +
        '  Windows: winget install ffmpeg  or  scoop install ffmpeg  or  choco install ffmpeg\n' +
        '  macOS: brew install ffmpeg\n' +
        '  Linux: sudo apt install ffmpeg'
      ));
    }

    const outputTemplate = path.join(defaultPath, '%(title)s.%(ext)s');

    // Simple, maximally-compatible format strings.
    const videoFormat = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
    const audioFormat = 'bestaudio[ext=m4a]/bestaudio/best';

    // Build args as an array — spawn handles quoting automatically
    const ytDlpBin = ytDlp.replace(/^"|"$/g, ''); // strip surrounding quotes
    const aria2cPath = await resolveAria2c();

    const args = [
      url,
      '-f', format === 'mp3' ? audioFormat : videoFormat,
      '--no-warnings',
      '--newline',
    ];

    if (aria2cPath) {
      // aria2c: 16 parallel HTTP range-requests per fragment — fastest possible
      const aria2cBin = aria2cPath.replace(/^"|"$/g, '');
      args.push(
        '--downloader', aria2cBin,
        '--downloader-args', 'aria2c:-x 16 -s 16 -k 1M --min-split-size=1M --quiet',
      );
    } else {
      // No aria2c: use concurrent fragments + chunk-size trick to beat YouTube throttle
      args.push(
        '--concurrent-fragments', String(Math.max(1, parseInt(threads) || 4)),
        '--http-chunk-size', '10M',
      );
    }

    args.push(
      '--buffer-size',      '16K',
      '--fragment-retries', '10',
      '-o', outputTemplate,
    );
    if (ffmpegPath) {
      const ffmpegBin = ffmpegPath.replace(/^"|"$/g, '');
      args.push('--ffmpeg-location', ffmpegBin);
    }
    if (format === 'mp3') args.push('-x', '--audio-format', 'mp3');

    const child = spawn(ytDlpBin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderrBuf = '';

    child.stderr.on('data', (data) => {
      const str = data.toString();
      stderrBuf += str;
      if (!onProgress) return;
      const match = str.match(/(\d+\.?\d*)%/);
      if (match) onProgress(parseFloat(match[1]));
    });

    child.on('error', (err) => reject(new Error(`Failed to start yt-dlp: ${err.message}`)));

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, filename: 'Downloaded successfully', path: defaultPath });
      } else {
        reject(new Error(`Download failed: ${extractErrors(stderrBuf) || `yt-dlp exited with code ${code}`}`));
      }
    });
  });
}

// Get video info and available formats
async function getVideoInfo(url) {
  try {
    const ytDlp = await resolveYtDlp();
    const command = `${ytDlp} "${url}" --dump-json --quiet --no-warnings --skip-download`;
    const { stdout, stderr } = await execPromise(command, { 
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000 
    });

    if (!stdout.trim()) {
      throw new Error('No output from yt-dlp');
    }

    const info = JSON.parse(stdout.trim());

    // Ensure critical fields exist with fallbacks
    info.title = info.title || 'Unknown Title';
    info.duration = Number(info.duration) || 0;
    info.uploader = info.uploader || info.uploader_id || 'Unknown';
    info.view_count = Number(info.view_count) || 0;
    info.upload_date = info.upload_date || '';

    // Handle thumbnails - prefer highest quality
    if (!info.thumbnail && info.thumbnails && info.thumbnails.length > 0) {
      const sorted = info.thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0));
      info.thumbnail = sorted[0].url;
    }

    return info;
  } catch (error) {
    throw new Error(`Failed to get video info: ${error.message}`);
  }
}

module.exports = {
  downloadYouTube,
  getVideoInfo,
};

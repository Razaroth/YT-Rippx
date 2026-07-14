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

// Download YouTube video/audio
async function downloadYouTube(url, format, quality, outputPath) {
  return new Promise(async (resolve, reject) => {
    let ytDlp;
    try { ytDlp = await resolveYtDlp(); } catch (e) { return reject(e); }

    const defaultPath = outputPath || path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'YTRippx');
    
    // Ensure output directory exists
    if (!fs.existsSync(defaultPath)) {
      fs.mkdirSync(defaultPath, { recursive: true });
    }

    const outputTemplate = `${defaultPath.replace(/\\/g, '/')}/%(title)s.%(ext)s`;
    const audioFormat = format === 'mp3' ? 'bestaudio/best' : 'best';
    const postprocessArgs = format === 'mp3' ? ['-x', '--audio-format', 'mp3'] : [];

    const args = [
      `"${url}"`,
      '-f',
      audioFormat,
      '-o',
      `"${outputTemplate}"`,
      ...postprocessArgs,
    ].join(' ');

    const command = `${ytDlp} ${args}`;

    const process = exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Download failed: ${stderr || error.message}`));
      } else {
        resolve({
          success: true,
          filename: 'Downloaded successfully',
          path: defaultPath,
        });
      }
    });

    // Optional: stream progress if needed
    process.stderr?.on('data', (data) => {
      const str = data.toString();
      // Could emit progress updates here
    });
  });
}

// Get video info and available formats
async function getVideoInfo(url) {
  try {
    const ytDlp = await resolveYtDlp();
    const command = `${ytDlp} "${url}" --dump-json --quiet --skip-download`;
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

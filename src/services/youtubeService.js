const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execPromise = promisify(exec);

// Download YouTube video/audio
async function downloadYouTube(url, format, quality, outputPath) {
  return new Promise((resolve, reject) => {
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

    const command = `yt-dlp ${args}`;

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
    const command = `yt-dlp "${url}" --dump-json --quiet --skip-download`;
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

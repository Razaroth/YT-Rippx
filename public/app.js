const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const videoInfo = document.getElementById('videoInfo');
const optionsPanel = document.getElementById('optionsPanel');
const downloadBtn = document.getElementById('downloadBtn');
const browseBtn = document.getElementById('browseBtn');
const formatSelect = document.getElementById('formatSelect');
const qualitySelect = document.getElementById('qualitySelect');
const outputPath = document.getElementById('outputPath');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const statusMessage = document.getElementById('statusMessage');
const historyContainer = document.getElementById('historyContainer');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

let currentUrl = '';
let defaultDownloadPath = '';

// Initialize
async function init() {
  // Get default download path
  const downloadDir = `${process.env.USERPROFILE || process.env.HOME}\\Downloads\\YTRippx`;
  outputPath.value = downloadDir;
  defaultDownloadPath = downloadDir;

  await loadHistory();
}

// Fetch video info
fetchBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim();
  if (!url) {
    showStatus('Please enter a YouTube URL', 'error');
    return;
  }

  currentUrl = url;
  fetchBtn.textContent = 'Loading...';
  fetchBtn.disabled = true;

  try {
    const res = await window.electronAPI.getFormats(url);
    if (!res.success) throw new Error(res.error || 'Failed to fetch video info');
    const result = res.data;
    document.getElementById('videoTitle').textContent = result.title || 'Unknown';
    
    const views = result.viewCount ? formatViews(result.viewCount) : '0';
    const uploader = result.uploader || 'Unknown';
    document.getElementById('videoDuration').innerHTML = `
      Duration: ${formatDuration(result.duration)} | 
      ${views} views | 
      <strong>${uploader}</strong>
    `;
    
    const thumbnail = document.getElementById('thumbnail');
    if (result.thumbnail) {
      thumbnail.src = result.thumbnail;
      thumbnail.onerror = () => {
        thumbnail.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect fill="%23ccc" width="320" height="180"/><text x="50%" y="50%" font-size="20" fill="%23999" text-anchor="middle" dominant-baseline="middle">No thumbnail</text></svg>';
      };
    } else {
      thumbnail.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect fill="%23ccc" width="320" height="180"/><text x="50%" y="50%" font-size="20" fill="%23999" text-anchor="middle" dominant-baseline="middle">No thumbnail</text></svg>';
    }
    
    videoInfo.classList.remove('hidden');
    optionsPanel.classList.remove('hidden');
    fetchBtn.textContent = 'Get Info';
    fetchBtn.disabled = false;
  } catch (error) {
    const errorMsg = error?.message || String(error);
    showStatus(`Error fetching video: ${errorMsg}`, 'error');
    fetchBtn.textContent = 'Get Info';
    fetchBtn.disabled = false;
  }
});

// Browse for output directory
browseBtn.addEventListener('click', async () => {
  const path = await window.electronAPI.selectDirectory();
  if (path) {
    outputPath.value = path;
  }
});

// Download
downloadBtn.addEventListener('click', async () => {
  if (!currentUrl) {
    showStatus('Please fetch video info first', 'error');
    return;
  }

  const format = formatSelect.value;
  const quality = qualitySelect.value;
  const path = outputPath.value;

  downloadBtn.disabled = true;
  progressContainer.classList.remove('hidden');
  progressFill.style.width = '0%';
  progressFill.classList.add('progress-fill--waiting');
  progressText.textContent = 'Starting download...';
  statusMessage.classList.add('hidden');

  // Listen for real-time progress from yt-dlp
  window.electronAPI.onDownloadProgress((percent) => {
    progressFill.classList.remove('progress-fill--waiting');
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${Math.round(percent)}%`;
  });

  try {
    const result = await window.electronAPI.download({
      url: currentUrl,
      format,
      quality,
      outputPath: path,
    });

    if (result.success) {
      window.electronAPI.removeDownloadProgressListeners();
      progressFill.classList.remove('progress-fill--waiting');
      progressFill.style.width = '100%';
      progressText.textContent = '100%';
      showStatus('Download complete!', 'success');
      await loadHistory();
      
      // Reset
      setTimeout(() => {
        urlInput.value = '';
        videoInfo.classList.add('hidden');
        optionsPanel.classList.add('hidden');
        progressContainer.classList.add('hidden');
        progressFill.classList.remove('progress-fill--waiting');
        progressFill.style.width = '0%';
        downloadBtn.disabled = false;
      }, 2000);
    } else {
      window.electronAPI.removeDownloadProgressListeners();
      showStatus(`Error: ${result.error}`, 'error');
      downloadBtn.disabled = false;
    }
  } catch (error) {
    window.electronAPI.removeDownloadProgressListeners();
    showStatus(`Download failed: ${error.message}`, 'error');
    downloadBtn.disabled = false;
  }
});

// Load history
async function loadHistory() {
  try {
    const result = await window.electronAPI.getHistory();
    
    if (result.success && result.data.length > 0) {
      historyContainer.innerHTML = result.data
        .map(
          (item) => `
        <div class="history-item">
          <strong>${item.filename}</strong>
          <div>${item.format.toUpperCase()} • ${item.quality}</div>
          <small>${new Date(item.timestamp).toLocaleString()}</small>
        </div>
      `
        )
        .join('');
    } else {
      historyContainer.innerHTML = '<p class="empty-message">No downloads yet</p>';
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

// Clear history
clearHistoryBtn.addEventListener('click', async () => {
  if (confirm('Are you sure you want to clear all download history?')) {
    try {
      const result = await window.electronAPI.clearHistory();
      if (result.success) {
        await loadHistory();
        showStatus('History cleared', 'success');
      }
    } catch (error) {
      showStatus(`Error: ${error.message}`, 'error');
    }
  }
});

// Utility functions
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function formatViews(viewCount) {
  if (!viewCount || isNaN(viewCount)) return '0 views';
  const num = Number(viewCount);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString() + ' views';
  }
}

// Initialize on load
init();

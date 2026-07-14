const { getVideoInfo } = require('./youtubeService');

async function getFormats(url) {
  try {
    const info = await getVideoInfo(url);
    
    // Extract best thumbnail URL
    let thumbnailUrl = '';
    if (info.thumbnails && Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
      // Get the highest quality thumbnail
      const sortedThumbs = info.thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0));
      thumbnailUrl = sortedThumbs[0].url;
    } else if (info.thumbnail) {
      thumbnailUrl = info.thumbnail;
    }

    const formats = {
      title: info.title || 'Unknown',
      thumbnail: thumbnailUrl,
      duration: info.duration || 0,
      uploader: info.uploader || 'Unknown',
      viewCount: info.view_count || 0,
      uploadDate: info.upload_date || '',
      videoFormats: [],
      audioFormats: [],
    };

    // Extract available formats
    if (info.formats && Array.isArray(info.formats)) {
      const uniqueFormats = new Map();
      
      info.formats.forEach((format) => {
        // Video formats
        if (format.vcodec && format.vcodec !== 'none' && format.height) {
          const key = format.height;
          if (!uniqueFormats.has(`video-${key}`)) {
            uniqueFormats.set(`video-${key}`, {
              format_id: format.format_id,
              height: format.height,
              fps: format.fps || 30,
              codec: format.vcodec,
              ext: format.ext,
            });
          }
        }
        // Audio formats
        if (format.acodec && format.acodec !== 'none' && !format.vcodec) {
          const key = format.abr || 128;
          if (!uniqueFormats.has(`audio-${key}`)) {
            uniqueFormats.set(`audio-${key}`, {
              format_id: format.format_id,
              bitrate: format.abr || 128,
              codec: format.acodec,
              ext: format.ext,
            });
          }
        }
      });

      // Convert map to arrays
      uniqueFormats.forEach((format, key) => {
        if (key.startsWith('video')) {
          formats.videoFormats.push(format);
        } else {
          formats.audioFormats.push(format);
        }
      });

      // Sort by quality
      formats.videoFormats.sort((a, b) => (b.height || 0) - (a.height || 0));
      formats.audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    }

    return formats;
  } catch (error) {
    throw new Error(`Failed to get formats: ${error.message}`);
  }
}

module.exports = {
  getFormats,
};

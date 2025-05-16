const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');

// Configure ffmpeg to use the static ffprobe path
ffmpeg.setFfprobePath(ffprobe.path);

/**
 * Gets the aspect ratio of a video file
 * @param {string} filePath - Path to the video file
 * @returns {Promise<{width: number, height: number, aspectRatio: string, orientation: string}>}
 */
function getVideoAspectRatio(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }

      try {
        // Find the video stream
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        
        if (!videoStream) {
          return reject(new Error('No video stream found'));
        }

        const width = videoStream.width;
        const height = videoStream.height;
        
        // Get the display aspect ratio if available, or calculate from dimensions
        let aspectRatio;
        if (videoStream.display_aspect_ratio && videoStream.display_aspect_ratio !== '0:1') {
          aspectRatio = videoStream.display_aspect_ratio;
        } else {
          // Calculate the aspect ratio and simplify it
          const gcd = (a, b) => b ? gcd(b, a % b) : a;
          const divisor = gcd(width, height);
          aspectRatio = `${width/divisor}:${height/divisor}`;
        }

        // Determine orientation: horizontal or vertical
        const orientation = width >= height ? 'H' : 'V';

        return resolve({
          width,
          height,
          aspectRatio,
          orientation
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Determines if a file is a video file based on its extension
 * @param {string} filename - Name of the file
 * @returns {boolean}
 */
function isVideoFile(filename) {
  const videoExtensions = [
    '.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', 
    '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.3g2'
  ];
  
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return videoExtensions.includes(ext);
}

module.exports = {
  getVideoAspectRatio,
  isVideoFile
}; 
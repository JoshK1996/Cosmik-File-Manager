import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Slider,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  VolumeUp as VolumeIcon,
  VolumeMute as MuteIcon,
  SkipNext as NextIcon,
  SkipPrevious as PrevIcon,
  Fullscreen as FullscreenIcon,
  ArrowBack as BackIcon,
  VideoFile as VideoIcon
} from '@mui/icons-material';
import { useStore } from '../store';
import path from 'path-browserify';

// This will be our mock VLC integration component
// In a real application, you would integrate with the actual VLC library
// depending on the platform (WebChimera.js for Electron on Windows, etc.)
const VideoPlayer = ({ file, onEnded }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (videoRef.current && file) {
      // Reset when a new file is loaded
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      setError(null);
      
      console.log('Loading video file:', file.path);
      console.log('Video URL:', encodeURI(`file://${file.path.replace(/\\/g, '/')}`));
    }
  }, [file]);
  
  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleStop = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };
  
  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleVolumeChange = (event, newValue) => {
    if (videoRef.current) {
      videoRef.current.volume = newValue / 100;
      setVolume(newValue);
    }
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  
  const handleSeek = (event, newValue) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newValue;
      setCurrentTime(newValue);
    }
  };
  
  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      } else if (videoRef.current.msRequestFullscreen) {
        videoRef.current.msRequestFullscreen();
      }
    }
  };
  
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) {
      onEnded();
    }
  };
  
  const handleError = (e) => {
    console.error('Video error:', e);
    setError(`Failed to load video: ${e.target.error ? e.target.error.message : 'Unknown error'}`);
  };
  
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <Box>
      <Box sx={{ position: 'relative', backgroundColor: '#000', borderRadius: 1, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          style={{ width: '100%', maxHeight: '600px' }}
          src={file ? encodeURI(`file://${file.path.replace(/\\/g, '/')}`) : ''}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleError}
          controls={false}
        />
        
        {error && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: 'rgba(0,0,0,0.7)',
              flexDirection: 'column',
              padding: 2
            }}
          >
            <Typography variant="h6" color="error" gutterBottom>
              Error Playing Video
            </Typography>
            <Typography variant="body2" color="white">
              {error}
            </Typography>
            <Typography variant="body2" color="white" sx={{ mt: 1 }}>
              Path: {file?.path}
            </Typography>
          </Box>
        )}
        
        {!file && !error && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: 'rgba(0,0,0,0.7)'
            }}
          >
            <Typography variant="h6" color="white">
              No video selected
            </Typography>
          </Box>
        )}
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <IconButton onClick={handlePlay} disabled={!file}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconButton>
          </Grid>
          
          <Grid item>
            <IconButton onClick={handleStop} disabled={!file}>
              <StopIcon />
            </IconButton>
          </Grid>
          
          <Grid item xs>
            <Slider
              value={currentTime}
              min={0}
              max={duration}
              onChange={handleSeek}
              disabled={!file || duration === 0}
            />
          </Grid>
          
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Typography>
          </Grid>
          
          <Grid item>
            <IconButton onClick={handleMute} disabled={!file}>
              {isMuted ? <MuteIcon /> : <VolumeIcon />}
            </IconButton>
          </Grid>
          
          <Grid item xs={2}>
            <Slider
              value={volume}
              min={0}
              max={100}
              onChange={handleVolumeChange}
              disabled={!file}
              size="small"
            />
          </Grid>
          
          <Grid item>
            <IconButton onClick={handleFullscreen} disabled={!file}>
              <FullscreenIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

const MediaPlayerPage = () => {
  const { selectedFiles, currentProject, projectFiles, isLoading } = useStore();
  const [currentFile, setCurrentFile] = useState(null);
  const [playlistFiles, setPlaylistFiles] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If we came here with selected files, use them
    if (selectedFiles && selectedFiles.length > 0) {
      setCurrentFile(selectedFiles[0]);
      setPlaylistFiles(selectedFiles);
    } 
    // Otherwise, build a playlist of all video files in the project
    else if (currentProject && projectFiles.length > 0) {
      const videoFiles = projectFiles.filter(file => {
        const ext = path.extname(file.name).toLowerCase();
        return ['.mp4', '.mov', '.avi', '.mkv', '.wmv'].includes(ext);
      });
      
      if (videoFiles.length > 0) {
        setCurrentFile(videoFiles[0]);
        setPlaylistFiles(videoFiles);
      }
    }
  }, [selectedFiles, currentProject, projectFiles]);
  
  const handlePlaylistItemClick = (file) => {
    setCurrentFile(file);
  };
  
  const handleNextVideo = () => {
    if (playlistFiles.length > 0 && currentFile) {
      const currentIndex = playlistFiles.findIndex(file => file.path === currentFile.path);
      if (currentIndex < playlistFiles.length - 1) {
        setCurrentFile(playlistFiles[currentIndex + 1]);
      }
    }
  };
  
  const handlePreviousVideo = () => {
    if (playlistFiles.length > 0 && currentFile) {
      const currentIndex = playlistFiles.findIndex(file => file.path === currentFile.path);
      if (currentIndex > 0) {
        setCurrentFile(playlistFiles[currentIndex - 1]);
      }
    }
  };
  
  return (
    <Box>
      {isLoading && <LinearProgress />}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Media Player
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<BackIcon />}
          onClick={() => navigate('/project/current')}
        >
          Back to Project
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {currentFile ? currentFile.name : 'No video selected'}
              </Typography>
              
              <VideoPlayer 
                file={currentFile} 
                onEnded={handleNextVideo}
              />
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <IconButton onClick={handlePreviousVideo} disabled={!currentFile || playlistFiles.findIndex(file => file.path === currentFile?.path) === 0}>
                  <PrevIcon />
                </IconButton>
                
                <Typography variant="body2" sx={{ mx: 2, alignSelf: 'center' }}>
                  {currentFile ? `${playlistFiles.findIndex(file => file.path === currentFile.path) + 1} of ${playlistFiles.length}` : '0 of 0'}
                </Typography>
                
                <IconButton onClick={handleNextVideo} disabled={!currentFile || playlistFiles.findIndex(file => file.path === currentFile?.path) === playlistFiles.length - 1}>
                  <NextIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Media Player Information
              </Typography>
              
              <Typography variant="body2" paragraph>
                This media player supports common video formats including MP4, MOV, AVI, MKV, and WMV.
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Keyboard Shortcuts:</strong>
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">• Space: Play/Pause</Typography>
                  <Typography variant="body2">• Right Arrow: Seek forward</Typography>
                  <Typography variant="body2">• Left Arrow: Seek backward</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">• Up Arrow: Volume up</Typography>
                  <Typography variant="body2">• Down Arrow: Volume down</Typography>
                  <Typography variant="body2">• F: Fullscreen</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" gutterBottom>
                Playlist ({playlistFiles.length} videos)
              </Typography>
              
              {playlistFiles.length === 0 ? (
                <Alert severity="info">
                  No video files found. Please select video files from the project page.
                </Alert>
              ) : (
                <List dense sx={{ maxHeight: '500px', overflow: 'auto' }}>
                  {playlistFiles.map((file, index) => (
                    <ListItem 
                      key={index} 
                      button 
                      selected={currentFile && currentFile.path === file.path}
                      onClick={() => handlePlaylistItemClick(file)}
                    >
                      <ListItemIcon>
                        <VideoIcon color={currentFile && currentFile.path === file.path ? 'primary' : 'inherit'} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={file.name} 
                        secondary={path.basename(path.dirname(file.path))}
                        primaryTypographyProps={{
                          color: currentFile && currentFile.path === file.path ? 'primary' : 'inherit',
                          variant: 'body2'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MediaPlayerPage; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
  Tabs,
  Tab,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Collapse,
  Badge
} from '@mui/material';
import {
  Folder as FolderIcon,
  VideoFile as VideoIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  SyncAlt as SyncAltIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  ViewList as ViewListIcon,
  Info as InfoIcon,
  VerticalAlignTop as VerticalIcon,
  HorizontalRule as HorizontalIcon,
  CompareArrows as CompareArrowsIcon,
  Close as CloseIcon,
  InsertDriveFile as InsertDriveFileIcon,
  AspectRatio as AspectRatioIcon
} from '@mui/icons-material';
import { useStore } from '../store';
import path from 'path-browserify';

const ProjectPage = () => {
  const { 
    currentProject,
    projectFiles,
    projectFolders,
    hFiles,
    vFiles,
    orphanedHFiles,
    orphanedVFiles,
    setCurrentProject,
    moveFilesToHVFolders,
    detectAndMoveFilesByAspectRatio,
    setSelectedFiles,
    isLoading
  } = useStore();
  
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState([]);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [organizingStatus, setOrganizingStatus] = useState({
    inProgress: false,
    step: 0,
    result: null
  });
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  
  useEffect(() => {
    // If no project is loaded and we're on the project page, redirect to home
    if (!currentProject) {
      navigate('/');
    }
  }, [currentProject, navigate]);
  
  const handleOrganizeFiles = async () => {
    // Reset previous results
    setOrganizingStatus({
      inProgress: true,
      step: 0,
      result: null
    });
    
    setNotification({
      type: 'info',
      message: 'Organizing files, please wait...'
    });
    
    // Begin organizing files - show progress
    setOrganizingStatus(prev => ({ ...prev, step: 1 }));
    
    // Analyze files
    setTimeout(() => {
      setOrganizingStatus(prev => ({ ...prev, step: 2 }));
    }, 1000);
    
    try {
      const result = await moveFilesToHVFolders();
      
      // Show completed step
      setOrganizingStatus({
        inProgress: false,
        step: 3,
        result: result
      });
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: result.message || 'Files organized successfully!'
        });
        
        // Display results dialog
        setResultDialogOpen(true);
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to organize files'
        });
        
        // Display results dialog
        setResultDialogOpen(true);
      }
    } catch (error) {
      setOrganizingStatus({
        inProgress: false,
        step: 0,
        result: { success: false, error: error.message }
      });
      
      setNotification({
        type: 'error',
        message: `Error organizing files: ${error.message}`
      });
    }
  };
  
  // New handler for auto-detecting video aspect ratios
  const handleAutoDetectAspectRatio = async () => {
    // Reset previous results
    setOrganizingStatus({
      inProgress: true,
      step: 0,
      result: null
    });
    
    setNotification({
      type: 'info',
      message: 'Analyzing video files, please wait...'
    });
    
    // Begin organizing files - show progress
    setOrganizingStatus(prev => ({ ...prev, step: 1 }));
    
    // Analyze files
    setTimeout(() => {
      setOrganizingStatus(prev => ({ ...prev, step: 2 }));
    }, 1000);
    
    try {
      // Use selected items if any, otherwise analyze all files
      const filesToProcess = selectedItems.length > 0 ? selectedItems : null;
      
      const result = await detectAndMoveFilesByAspectRatio(filesToProcess);
      
      // Show completed step
      setOrganizingStatus({
        inProgress: false,
        step: 3,
        result: result
      });
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Videos have been analyzed and organized by aspect ratio!'
        });
        
        // Display results dialog
        setResultDialogOpen(true);
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Failed to analyze and organize videos'
        });
        
        // Display results dialog
        setResultDialogOpen(true);
      }
    } catch (error) {
      setOrganizingStatus({
        inProgress: false,
        step: 0,
        result: { success: false, error: error.message }
      });
      
      setNotification({
        type: 'error',
        message: `Error analyzing videos: ${error.message}`
      });
    }
  };
  
  const handleSelectItem = (file) => {
    const isSelected = selectedItems.some(item => item.path === file.path);
    
    if (isSelected) {
      setSelectedItems(selectedItems.filter(item => item.path !== file.path));
    } else {
      setSelectedItems([...selectedItems, file]);
    }
  };
  
  const handleSelectAll = (files) => {
    if (selectedItems.length === files.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...files]);
    }
  };
  
  const handleBatchRename = () => {
    if (selectedItems.length === 0) {
      setNotification({
        type: 'warning',
        message: 'Please select one or more files to rename'
      });
      return;
    }
    
    // Save selected files to both store and localStorage directly
    setSelectedFiles(selectedItems);
    
    // Add a console log to verify selected files
    console.log('Selected files for batch rename:', selectedItems.length, selectedItems);
    
    // Force a short delay to ensure state is updated before navigation
    setTimeout(() => {
      navigate('/batch-rename');
    }, 100);
  };
  
  const handlePlayVideo = (file) => {
    setSelectedFiles([file]);
    navigate('/media-player');
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const handleShowDetails = (file) => {
    setSelectedFile(file);
    setDetailsDialogOpen(true);
  };
  
  // Get the filtered files based on the active tab
  const getFilteredFiles = () => {
    switch (activeTab) {
      case 0: // All Files
        return projectFiles;
      case 1: // H Files
        return hFiles;
      case 2: // V Files
        return vFiles;
      case 3: // Missing Counterparts
        return [...orphanedHFiles, ...orphanedVFiles];
      default:
        return projectFiles;
    }
  };
  
  const handleSelectAllWithTag = (tagType) => {
    // Find all files with the same tag type
    const filesWithTag = filteredFiles.filter(file => {
      const isH = file.name.includes(' - H');
      const isV = file.name.includes(' - V');
      const isOrphaned = 
        (isH && orphanedHFiles.some(f => f.path === file.path)) || 
        (isV && orphanedVFiles.some(f => f.path === file.path));
      
      if (tagType === "Missing V Partner" && isH && isOrphaned) return true;
      if (tagType === "Missing H Partner" && isV && isOrphaned) return true;
      if (tagType === "Has V Partner" && isH && !isOrphaned) return true;
      if (tagType === "Has H Partner" && isV && !isOrphaned) return true;
      if (tagType === "Regular File" && !isH && !isV) return true;
      if (tagType === "Original File" && !file.name.includes(' - H') && !file.name.includes(' - V')) return true;
      
      return false;
    });
    
    // Select all these files
    setSelectedItems(filesWithTag);
    
    // Show notification
    setNotification({
      type: 'success',
      message: `Selected ${filesWithTag.length} files with "${tagType}" tag`
    });
  };
  
  if (!currentProject) {
    return <Typography>No project selected. Please select a project first.</Typography>;
  }
  
  const filteredFiles = getFilteredFiles();
  const paginatedFiles = filteredFiles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  return (
    <Box>
      {isLoading && <LinearProgress />}
      
      {notification && (
        <Alert 
          severity={notification.type} 
          sx={{ mb: 2 }}
          onClose={() => setNotification(null)}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setNotification(null)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>
            {notification.type === 'success' ? 'Success' : 
              notification.type === 'error' ? 'Error' : 
              notification.type === 'warning' ? 'Warning' : 'Info'}
          </AlertTitle>
          {notification.message}
        </Alert>
      )}
      
      {/* Organization Progress */}
      <Collapse in={organizingStatus.inProgress}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Organizing Files...
          </Typography>
          <Stepper activeStep={organizingStatus.step} sx={{ mb: 2 }}>
            <Step>
              <StepLabel>Preparing</StepLabel>
            </Step>
            <Step>
              <StepLabel>Analyzing Files</StepLabel>
            </Step>
            <Step>
              <StepLabel>Moving Files</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete</StepLabel>
            </Step>
          </Stepper>
          <LinearProgress />
        </Paper>
      </Collapse>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Project: {path.basename(currentProject.path)}
        </Typography>
        
        <Box>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SyncAltIcon />}
            onClick={handleOrganizeFiles}
            sx={{ mr: 1 }}
            disabled={organizingStatus.inProgress}
          >
            Organize Files
          </Button>
          
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<AspectRatioIcon />}
            onClick={handleAutoDetectAspectRatio}
            sx={{ mr: 1 }}
            disabled={organizingStatus.inProgress}
            title="Detect video aspect ratios and move files to H/V folders automatically"
          >
            Auto-Detect Aspect Ratios
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />}
            onClick={handleBatchRename}
            disabled={selectedItems.length === 0}
          >
            Batch Rename
          </Button>
        </Box>
      </Box>
      
      <Typography variant="subtitle1" color="text.secondary">
        Location: {currentProject.path}
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Project Statistics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Project Statistics
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Badge badgeContent={projectFiles.length} color="primary" max={999}>
                      <VideoIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Total Files" 
                    secondary={projectFiles.length} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Badge badgeContent={projectFolders.length} color="primary" max={999}>
                      <FolderIcon />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Total Folders" 
                    secondary={projectFolders.length} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Badge badgeContent={hFiles.length} color="primary" max={999}>
                      <HorizontalIcon color="primary" />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="H Files" 
                    secondary={hFiles.length} 
                    primaryTypographyProps={{
                      style: { fontWeight: 'bold', color: '#1976d2' }
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Badge badgeContent={vFiles.length} color="secondary" max={999}>
                      <VerticalIcon color="secondary" />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="V Files" 
                    secondary={vFiles.length}
                    primaryTypographyProps={{
                      style: { fontWeight: 'bold', color: '#9c27b0' }
                    }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Badge badgeContent={orphanedHFiles.length + orphanedVFiles.length} color="error" max={999}>
                      <WarningIcon color="error" />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText 
                    primary="Files Missing Counterparts" 
                    secondary={orphanedHFiles.length + orphanedVFiles.length} 
                    secondaryTypographyProps={{
                      color: orphanedHFiles.length + orphanedVFiles.length > 0 ? 'error' : 'textSecondary'
                    }}
                    primaryTypographyProps={{
                      style: { 
                        fontWeight: orphanedHFiles.length + orphanedVFiles.length > 0 ? 'bold' : 'normal',
                        color: orphanedHFiles.length + orphanedVFiles.length > 0 ? '#d32f2f' : 'inherit'
                      }
                    }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Missing Counterparts */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Files Missing Counterparts
              </Typography>
              
              {orphanedHFiles.length === 0 && orphanedVFiles.length === 0 ? (
                <Alert severity="success">
                  <AlertTitle>All Files Matched!</AlertTitle>
                  All files have matching counterparts. Your project is well-organized.
                </Alert>
              ) : (
                <>
                  {orphanedHFiles.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="subtitle1" 
                        color="error" 
                        gutterBottom
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          backgroundColor: 'rgba(211, 47, 47, 0.1)',
                          p: 1,
                          borderRadius: 1
                        }}
                      >
                        <HorizontalIcon color="primary" sx={{ mr: 1 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <strong>H Files Missing V Counterparts</strong> ({orphanedHFiles.length})
                          <Tooltip title="H files that don't have a matching V file">
                            <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </Typography>
                      <List dense sx={{ 
                        maxHeight: '200px',
                        overflow: 'auto',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1
                      }}>
                        {orphanedHFiles.slice(0, 5).map((file, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Badge badgeContent="H" color="primary">
                                <WarningIcon color="error" />
                              </Badge>
                            </ListItemIcon>
                            <ListItemText 
                              primary={file.name} 
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <FolderIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                  {path.relative(currentProject.path, path.dirname(file.path))}
                                </Box>
                              } 
                            />
                            <Tooltip title="View All">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setActiveTab(3); // Switch to Missing Counterparts tab
                                  setPage(0);
                                }}
                              >
                                <ViewListIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItem>
                        ))}
                        {orphanedHFiles.length > 5 && (
                          <ListItem 
                            button 
                            onClick={() => {
                              setActiveTab(3); // Switch to Missing Counterparts tab
                              setPage(0);
                            }}
                          >
                            <ListItemText 
                              primary={`View all ${orphanedHFiles.length} files...`}
                              primaryTypographyProps={{ color: 'primary' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  )}
                  
                  {orphanedVFiles.length > 0 && (
                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        color="error" 
                        gutterBottom
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          backgroundColor: 'rgba(211, 47, 47, 0.1)',
                          p: 1,
                          borderRadius: 1
                        }}
                      >
                        <VerticalIcon color="secondary" sx={{ mr: 1 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <strong>V Files Missing H Counterparts</strong> ({orphanedVFiles.length})
                          <Tooltip title="V files that don't have a matching H file">
                            <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
                          </Tooltip>
                        </Box>
                      </Typography>
                      <List dense sx={{ 
                        maxHeight: '200px',
                        overflow: 'auto',
                        border: '1px solid #e0e0e0',
                        borderRadius: 1
                      }}>
                        {orphanedVFiles.slice(0, 5).map((file, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Badge badgeContent="V" color="secondary">
                                <WarningIcon color="error" />
                              </Badge>
                            </ListItemIcon>
                            <ListItemText 
                              primary={file.name} 
                              secondary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <FolderIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                  {path.relative(currentProject.path, path.dirname(file.path))}
                                </Box>
                              } 
                            />
                            <Tooltip title="View All">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setActiveTab(3); // Switch to Missing Counterparts tab
                                  setPage(0);
                                }}
                              >
                                <ViewListIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItem>
                        ))}
                        {orphanedVFiles.length > 5 && (
                          <ListItem 
                            button 
                            onClick={() => {
                              setActiveTab(3); // Switch to Missing Counterparts tab
                              setPage(0);
                            }}
                          >
                            <ListItemText 
                              primary={`View all ${orphanedVFiles.length} files...`}
                              primaryTypographyProps={{ color: 'secondary' }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
            <CardActions>
              <Button 
                onClick={handleOrganizeFiles}
                startIcon={<SyncAltIcon />}
                color="primary"
                disabled={organizingStatus.inProgress}
              >
                Organize Files
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      {/* File List */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => {
            setActiveTab(newValue);
            setPage(0);
          }}
          sx={{ mb: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={
              <Badge badgeContent={projectFiles.length} color="default" max={999}>
                All Files
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={hFiles.length} color="primary" max={999}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HorizontalIcon sx={{ mr: 0.5 }} />
                  H Files
                </Box>
              </Badge>
            }
            sx={{ 
              color: 'primary.main',
              fontWeight: 'bold'
            }}
          />
          <Tab 
            label={
              <Badge badgeContent={vFiles.length} color="secondary" max={999}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VerticalIcon sx={{ mr: 0.5 }} />
                  V Files
                </Box>
              </Badge>
            }
            sx={{ 
              color: 'secondary.main',
              fontWeight: 'bold'
            }}
          />
          <Tab 
            label={
              <Badge badgeContent={orphanedHFiles.length + orphanedVFiles.length} color="error" max={999}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarningIcon sx={{ mr: 0.5 }} />
                  Missing Counterparts
                </Box>
              </Badge>
            }
            sx={{ 
              color: orphanedHFiles.length + orphanedVFiles.length > 0 ? 'error.main' : 'inherit',
              fontWeight: orphanedHFiles.length + orphanedVFiles.length > 0 ? 'bold' : 'normal'
            }}
          />
        </Tabs>
        
        {/* Legend */}
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ width: '100%', mb: 1 }}>Legend:</Typography>
          <Chip 
            size="small" 
            icon={<HorizontalIcon />} 
            label="H File" 
            color="primary" 
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAllWithTag("Has V Partner");
            }}
          />
          <Chip 
            size="small" 
            icon={<VerticalIcon />} 
            label="V File" 
            color="secondary" 
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAllWithTag("Has H Partner");
            }}
          />
          <Chip 
            size="small" 
            icon={<FolderIcon />} 
            label="H Folder" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            size="small" 
            icon={<FolderIcon />} 
            label="V Folder" 
            color="secondary" 
            variant="outlined"
          />
          <Chip 
            size="small" 
            icon={<CheckIcon />} 
            label="Matched File" 
            color="success" 
            variant="outlined"
          />
          <Chip 
            size="small" 
            icon={<WarningIcon />} 
            label="Orphaned File" 
            color="error" 
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAllWithTag("Missing V Partner");
            }}
          />
          <Chip 
            size="small" 
            icon={<InsertDriveFileIcon />} 
            label="Regular File" 
            color="warning" 
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAllWithTag("Regular File");
            }}
          />
          
          <Chip 
            size="small" 
            icon={<InsertDriveFileIcon />} 
            label="Original File" 
            color="info" 
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAllWithTag("Original File");
            }}
          />
          
          <Box sx={{ width: '100%', mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Click on any tag to select all files with that tag type
            </Typography>
            
            <Button 
              size="small"
              variant="contained"
              color="primary"
              disabled={selectedItems.length === 0}
              onClick={handleBatchRename}
              startIcon={<EditIcon />}
            >
              Batch Rename Selected ({selectedItems.length})
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {activeTab === 0 && 'Project Files'}
            {activeTab === 1 && 'H Files'}
            {activeTab === 2 && 'V Files'}
            {activeTab === 3 && 'Files Missing Counterparts'}
          </Typography>
          
          <Box>
            <Button 
              size="small" 
              color="primary"
              onClick={() => handleSelectAll(filteredFiles)}
            >
              {selectedItems.length === filteredFiles.length && filteredFiles.length > 0 ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>
        </Box>
        
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox 
                    indeterminate={selectedItems.length > 0 && selectedItems.length < filteredFiles.length}
                    checked={selectedItems.length === filteredFiles.length && filteredFiles.length > 0}
                    onChange={() => handleSelectAll(filteredFiles)}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      No files found in this category
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFiles.map((file, index) => {
                  const isH = file.name.includes(' - H');
                  const isV = file.name.includes(' - V');
                  
                  const isOrphaned = 
                    (isH && orphanedHFiles.some(f => f.path === file.path)) || 
                    (isV && orphanedVFiles.some(f => f.path === file.path));
                  
                  const isVideo = ['.mp4', '.mov', '.avi', '.mkv', '.wmv'].includes(path.extname(file.name).toLowerCase());
                  const isSelected = selectedItems.some(item => item.path === file.path);
                  
                  // Determine folder location display
                  const folderLocation = path.relative(currentProject.path, path.dirname(file.path)) || 'Project Root';
                  
                  // Determine if file is in H/V folder
                  const inHFolder = folderLocation.toLowerCase().includes('/h') || folderLocation.toLowerCase().includes('\\h');
                  const inVFolder = folderLocation.toLowerCase().includes('/v') || folderLocation.toLowerCase().includes('\\v');
                  
                  return (
                    <TableRow 
                      key={index}
                      hover
                      selected={isSelected}
                      sx={{ 
                        cursor: 'pointer',
                        backgroundColor: isOrphaned ? 'rgba(255, 0, 0, 0.05)' : (
                          isH ? 'rgba(25, 118, 210, 0.04)' : (
                            isV ? 'rgba(156, 39, 176, 0.04)' : 'inherit'
                          )
                        )
                      }}
                      onClick={() => handleSelectItem(file)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {isVideo ? (
                            <VideoIcon sx={{ mr: 1, color: 'primary.main' }} />
                          ) : (
                            <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                          )}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: isH || isV ? 'medium' : 'normal',
                              color: isH ? 'primary.main' : (isV ? 'secondary.main' : 'inherit')
                            }}
                          >
                            {file.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {isH && (
                          <Chip 
                            size="small" 
                            label="H" 
                            color={isOrphaned ? "error" : "primary"} 
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '14px',
                              '& .MuiChip-label': {
                                display: 'flex',
                                alignItems: 'center'
                              }
                            }}
                            icon={<HorizontalIcon />}
                          />
                        )}
                        {isV && (
                          <Chip 
                            size="small" 
                            label="V" 
                            color={isOrphaned ? "error" : "secondary"}
                            sx={{ 
                              fontWeight: 'bold',
                              fontSize: '14px',
                              '& .MuiChip-label': {
                                display: 'flex',
                                alignItems: 'center'
                              }
                            }}
                            icon={<VerticalIcon />}
                          />
                        )}
                        {!isH && !isV && path.extname(file.name)}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {inHFolder ? (
                            <Chip 
                              size="small" 
                              label="H Folder" 
                              variant="outlined"
                              color="primary"
                              icon={<FolderIcon />} 
                              sx={{ mr: 1 }}
                            />
                          ) : inVFolder ? (
                            <Chip 
                              size="small" 
                              label="V Folder" 
                              variant="outlined" 
                              color="secondary" 
                              icon={<FolderIcon />} 
                              sx={{ mr: 1 }}
                            />
                          ) : null}
                          <Typography variant="body2" noWrap sx={{ maxWidth: '150px' }}>
                            {folderLocation}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        {isOrphaned ? (
                          <Chip 
                            size="small" 
                            label={isH ? "Missing V Partner" : "Missing H Partner"} 
                            color="error"
                            icon={<WarningIcon fontSize="small" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllWithTag(isH ? "Missing V Partner" : "Missing H Partner");
                            }}
                          />
                        ) : (
                          <Chip 
                            size="small" 
                            label={isH ? "Has V Partner" : (isV ? "Has H Partner" : "Original File")}
                            color={isH || isV ? "success" : "info"}
                            icon={<CheckIcon fontSize="small" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAllWithTag(isH ? "Has V Partner" : (isV ? "Has H Partner" : "Original File"));
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {isVideo && (
                          <Tooltip title="Play Video">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayVideo(file);
                              }}
                            >
                              <PlayIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Details">
                          <IconButton 
                            size="small" 
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowDetails(file);
                            }}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredFiles.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* File Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedFile && (
          <>
            <DialogTitle>
              File Details
            </DialogTitle>
            <DialogContent>
              <Typography variant="h6" gutterBottom>{selectedFile.name}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Path</Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedFile.path}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Size</Typography>
                  <Typography variant="body2" gutterBottom>
                    {formatFileSize(selectedFile.size)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Created</Typography>
                  <Typography variant="body2" gutterBottom>
                    {new Date(selectedFile.created).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Modified</Typography>
                  <Typography variant="body2" gutterBottom>
                    {new Date(selectedFile.modified).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
              {['.mp4', '.mov', '.avi', '.mkv', '.wmv'].includes(path.extname(selectedFile.name).toLowerCase()) && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handlePlayVideo(selectedFile);
                  }}
                >
                  Play Video
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Organization Results Dialog */}
      <Dialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          File Organization Results
          <IconButton
            aria-label="close"
            onClick={() => setResultDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {organizingStatus.result && (
            <>
              <Alert 
                severity={organizingStatus.result.success ? "success" : "error"}
                sx={{ mb: 2 }}
              >
                <AlertTitle>{organizingStatus.result.success ? "Success" : "Error"}</AlertTitle>
                {organizingStatus.result.message || (organizingStatus.result.success ? 
                  "Files have been successfully organized." : 
                  "Failed to organize some files.")}
              </Alert>
              
              <Typography variant="h6" gutterBottom>Summary</Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Card sx={{ 
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    height: '100%'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HorizontalIcon sx={{ mr: 1 }} />
                        <Typography variant="h5">
                          {organizingStatus.result.hMoved || 0}
                        </Typography>
                      </Box>
                      <Typography variant="body2">H Files Moved</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ 
                    backgroundColor: 'secondary.light',
                    color: 'secondary.contrastText',
                    height: '100%'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VerticalIcon sx={{ mr: 1 }} />
                        <Typography variant="h5">
                          {organizingStatus.result.vMoved || 0}
                        </Typography>
                      </Box>
                      <Typography variant="body2">V Files Moved</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {organizingStatus.result.errors && organizingStatus.result.errors.length > 0 && (
                <>
                  <Typography variant="h6" color="error" gutterBottom>Errors</Typography>
                  <List dense sx={{ 
                    maxHeight: '200px',
                    overflow: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1
                  }}>
                    {organizingStatus.result.errors.map((error, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <WarningIcon color="error" />
                        </ListItemIcon>
                        <ListItemText primary={error} />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)}>Close</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleOrganizeFiles}
            disabled={organizingStatus.inProgress}
          >
            Try Again
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectPage; 
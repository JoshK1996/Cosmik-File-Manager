import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import path from 'path-browserify';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  IconButton,
  Radio,
  RadioGroup,
  FormLabel,
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  VideoFile as VideoIcon,
  Preview as PreviewIcon,
  InsertDriveFile as FileIcon,
  HorizontalRule as HorizontalIcon,
  VerticalAlignTop as VerticalIcon,
  Help as HelpIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useStore } from '../store';

const BatchRenamePage = () => {
  const navigate = useNavigate();
  const { 
    selectedFiles, 
    batchRenameFiles,
    orphanedHFiles,
    orphanedVFiles,
    isLoading 
  } = useStore();
  
  const [files, setFiles] = useState([]);
  const [pattern, setPattern] = useState('');
  const [replacement, setReplacement] = useState('');
  const [operation, setOperation] = useState('replace');
  const [keepExtension, setKeepExtension] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [padding, setPadding] = useState(2);
  const [preview, setPreview] = useState([]);
  const [previewResults, setPreviewResults] = useState([]);
  const [notification, setNotification] = useState(null);
  const [groupedFiles, setGroupedFiles] = useState({
    hFiles: [],
    vFiles: [],
    regularFiles: [],
    orphanedHFiles: [],
    orphanedVFiles: []
  });
  
  useEffect(() => {
    console.log('BatchRenamePage: Selected files received:', selectedFiles ? selectedFiles.length : 0);
    
    if (selectedFiles && selectedFiles.length > 0) {
      console.log('Setting files for batch rename');
      setFiles(selectedFiles);
    } else {
      console.log('No files available for batch rename');
      setNotification({
        type: 'warning',
        message: 'No files selected for renaming. Please return to the project page and select files first.'
      });
      
      // Try to recover from localStorage directly as a fallback
      try {
        const savedFilesData = localStorage.getItem('selectedFiles');
        if (savedFilesData) {
          const savedFiles = JSON.parse(savedFilesData);
          console.log('Recovered files from localStorage:', savedFiles.length);
          if (savedFiles.length > 0) {
            setFiles(savedFiles);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to recover files from localStorage:', error);
      }
    }
  }, [selectedFiles]);
  
  useEffect(() => {
    if (files && files.length > 0) {
      // Group files by type
      const groups = {
        hFiles: files.filter(file => file.name.includes(' - H') && !orphanedHFiles.some(f => f.path === file.path)),
        vFiles: files.filter(file => file.name.includes(' - V') && !orphanedVFiles.some(f => f.path === file.path)),
        regularFiles: files.filter(file => !file.name.includes(' - H') && !file.name.includes(' - V')),
        orphanedHFiles: files.filter(file => orphanedHFiles.some(f => f.path === file.path)),
        orphanedVFiles: files.filter(file => orphanedVFiles.some(f => f.path === file.path))
      };
      
      setGroupedFiles(groups);
    }
  }, [files, orphanedHFiles, orphanedVFiles]);
  
  const generatePreview = () => {
    const newPreview = files.map(file => {
      const fileName = path.basename(file.name, path.extname(file.name));
      const extension = path.extname(file.name);
      let newName = fileName;
      
      switch (operation) {
        case 'replace':
          if (pattern) {
            const regex = caseSensitive ? new RegExp(pattern, 'g') : new RegExp(pattern, 'gi');
            newName = fileName.replace(regex, replacement);
          }
          break;
        
        case 'append':
          newName = fileName + replacement;
          break;
        
        case 'prepend':
          newName = replacement + fileName;
          break;
        
        case 'remove':
          const removeRegex = caseSensitive ? new RegExp(pattern, 'g') : new RegExp(pattern, 'gi');
          newName = fileName.replace(removeRegex, '');
          break;
        
        default:
          break;
      }
      
      if (keepExtension) {
        newName += extension;
      }
      
      return {
        original: file,
        originalName: file.name,
        newName: newName
      };
    });
    
    setPreview(newPreview);
  };
  
  const handleApplyRename = async () => {
    let pattern, replacement;
    
    switch (operation) {
      case 'replace':
        if (!pattern) {
          setNotification({
            type: 'error',
            message: 'Please enter text to find'
          });
          return;
        }
        pattern = pattern;
        replacement = replacement;
        break;
        
      case 'append':
        if (!replacement) {
          setNotification({
            type: 'error',
            message: 'Please enter text to append'
          });
          return;
        }
        pattern = '^(.*)$';
        replacement = '$1' + replacement;
        break;
        
      case 'prepend':
        if (!replacement) {
          setNotification({
            type: 'error',
            message: 'Please enter text to prepend'
          });
          return;
        }
        pattern = '^(.*)$';
        replacement = replacement + '$1';
        break;
        
      case 'remove':
        if (!pattern) {
          setNotification({
            type: 'error',
            message: 'Please enter text to remove'
          });
          return;
        }
        pattern = pattern;
        replacement = '';
        break;
        
      default:
        break;
    }
    
    // For operations other than addNumbering
    const result = await batchRenameFiles(files, pattern, replacement);
    
    if (result && result.success) {
      setNotification({
        type: 'success',
        message: `Successfully renamed ${result.results.length} files`
      });
    } else {
      setNotification({
        type: 'error',
        message: result ? result.error : 'Failed to rename files'
      });
    }
  };
  
  const handlePreview = (file) => {
    // Generate a preview for a single file
    const oldName = file.name;
    let newName = oldName;
    
    try {
      const extension = path.extname(oldName);
      const baseName = path.basename(oldName, keepExtension ? extension : '');
      
      switch (operation) {
        case 'replace':
          const regex = caseSensitive ? new RegExp(pattern, 'g') : new RegExp(pattern, 'gi');
          newName = baseName.replace(regex, replacement);
          break;
        case 'append':
          newName = baseName + replacement;
          break;
        case 'prepend':
          newName = replacement + baseName;
          break;
        case 'remove':
          const removeRegex = caseSensitive ? new RegExp(pattern, 'g') : new RegExp(pattern, 'gi');
          newName = baseName.replace(removeRegex, '');
          break;
        default:
          newName = baseName;
      }
      
      if (keepExtension) {
        newName += extension;
      }
      
      // Add the preview result
      setPreviewResults([{
        oldName,
        newName,
        path: file.path
      }]);
      
    } catch (error) {
      setNotification({
        type: 'error',
        message: `Preview error: ${error.message}`
      });
    }
  };
  
  return (
    <Box>
      {isLoading && <LinearProgress />}
      
      {notification && (
        <Alert 
          severity={notification.type} 
          sx={{ mb: 2 }}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Batch Rename
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<BackIcon />}
            onClick={() => navigate('/project/current')}
            sx={{ mr: 1 }}
          >
            Back to Project
          </Button>
          
          {(!selectedFiles || selectedFiles.length === 0) && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/project/current')}
            >
              Select Files
            </Button>
          )}
        </Box>
      </Box>
      
      {(!selectedFiles || selectedFiles.length === 0) ? (
        <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Files Selected
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Please return to the project page and select files you wish to rename.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/project/current')}
            sx={{ mt: 2 }}
          >
            Go to Project Page
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Rename Options
                </Typography>
                
                <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                  <FormLabel component="legend">Operation Type</FormLabel>
                  <RadioGroup
                    value={operation}
                    onChange={(e) => setOperation(e.target.value)}
                  >
                    <FormControlLabel 
                      value="replace" 
                      control={<Radio />} 
                      label="Find and Replace" 
                    />
                    <FormControlLabel 
                      value="append" 
                      control={<Radio />} 
                      label="Append" 
                    />
                    <FormControlLabel 
                      value="prepend" 
                      control={<Radio />} 
                      label="Prepend" 
                    />
                    <FormControlLabel 
                      value="remove" 
                      control={<Radio />} 
                      label="Remove" 
                    />
                  </RadioGroup>
                </FormControl>
                
                <Divider sx={{ my: 2 }} />
                
                {operation === 'replace' && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Find and Replace Settings
                    </Typography>
                    
                    <TextField
                      label="Find Text"
                      fullWidth
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    
                    <TextField
                      label="Replace With"
                      fullWidth
                      value={replacement}
                      onChange={(e) => setReplacement(e.target.value)}
                    />
                  </Box>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<PreviewIcon />}
                  onClick={generatePreview}
                  disabled={files.length === 0}
                  fullWidth
                >
                  Generate Preview
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Files to Rename ({files.length})
                </Typography>
                
                {files.length === 0 ? (
                  <Alert severity="info">
                    No files selected for renaming. Please select files from the project page.
                  </Alert>
                ) : (
                  <>
                    {preview.length > 0 ? (
                      <Box>
                        <List dense>
                          {preview.slice(0, 10).map((item, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <FileIcon />
                              </ListItemIcon>
                              <ListItemText 
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography 
                                      variant="body2" 
                                      component="span" 
                                      sx={{ mr: 1 }}
                                    >
                                      {item.originalName}
                                    </Typography>
                                    <ArrowIcon fontSize="small" sx={{ mx: 1 }} />
                                    <Typography 
                                      variant="body2" 
                                      component="span" 
                                      sx={{ fontWeight: 'bold' }}
                                    >
                                      {item.newName}
                                    </Typography>
                                  </Box>
                                }
                                secondary={path.dirname(item.original.path)}
                              />
                            </ListItem>
                          ))}
                          
                          {files.length > 10 && (
                            <ListItem>
                              <ListItemText 
                                primary={`...and ${files.length - 10} more files`}
                                primaryTypographyProps={{ color: 'text.secondary' }}
                              />
                            </ListItem>
                          )}
                        </List>
                        
                        <Box sx={{ mt: 2 }}>
                          <Button 
                            variant="contained" 
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={handleApplyRename}
                            disabled={preview.length === 0}
                          >
                            Apply Rename
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box>
                        <List dense>
                          {files.slice(0, 10).map((file, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <FileIcon />
                              </ListItemIcon>
                              <ListItemText 
                                primary={file.name}
                                secondary={path.dirname(file.path)}
                              />
                            </ListItem>
                          ))}
                          
                          {files.length > 10 && (
                            <ListItem>
                              <ListItemText 
                                primary={`...and ${files.length - 10} more files`}
                                primaryTypographyProps={{ color: 'text.secondary' }}
                              />
                            </ListItem>
                          )}
                        </List>
                        
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                          <Typography color="text.secondary">
                            Configure rename options and click "Generate Preview" to see results
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  Tips for Batch Renaming
                  <Tooltip title="Helpful information for renaming files">
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Find and Replace:</strong> Replaces text in filenames. Use this to fix typos or update naming conventions.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Append:</strong> Adds text after the filename. Useful for adding version information or suffixes.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Prepend:</strong> Adds text before the filename. Useful for adding prefixes or categories.
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Remove:</strong> Removes text from filenames. Useful for cleaning up filenames or removing unwanted text.
                </Typography>
                
                <Typography variant="body2">
                  <strong>Preview:</strong> Always use the preview function to verify changes before applying them.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Preview Files for Rename
        </Typography>
        
        {previewResults.length > 0 ? (
          <List>
            {previewResults.map((result, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        component="span" 
                        sx={{ 
                          textDecoration: 'line-through',
                          color: 'text.secondary',
                          mr: 2
                        }}
                      >
                        {result.oldName}
                      </Typography>
                      <Typography component="span" sx={{ fontWeight: 'bold' }}>
                        → {result.newName}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {Object.entries(groupedFiles).map(([groupKey, groupFiles]) => {
                if (groupFiles.length === 0) return null;
                
                let groupTitle, chipColor, chipIcon;
                switch(groupKey) {
                  case 'hFiles':
                    groupTitle = 'H Files with Partners';
                    chipColor = 'primary';
                    chipIcon = <HorizontalIcon />;
                    break;
                  case 'vFiles':
                    groupTitle = 'V Files with Partners';
                    chipColor = 'secondary';
                    chipIcon = <VerticalIcon />;
                    break;
                  case 'regularFiles':
                    groupTitle = 'Regular Files';
                    chipColor = 'warning';
                    chipIcon = <FileIcon />;
                    break;
                  case 'orphanedHFiles':
                    groupTitle = 'H Files Missing Partners';
                    chipColor = 'error';
                    chipIcon = <HorizontalIcon />;
                    break;
                  case 'orphanedVFiles':
                    groupTitle = 'V Files Missing Partners';
                    chipColor = 'error';
                    chipIcon = <VerticalIcon />;
                    break;
                  default:
                    groupTitle = 'Other Files';
                    chipColor = 'default';
                    chipIcon = <FileIcon />;
                }
                
                return (
                  <Grid item xs={12} key={groupKey}>
                    <Box sx={{ mb: 1 }}>
                      <Chip
                        icon={chipIcon}
                        label={`${groupTitle} (${groupFiles.length})`}
                        color={chipColor}
                        size="small"
                      />
                    </Box>
                    <Grid container spacing={1}>
                      {groupFiles.map((file, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card variant="outlined" sx={{ height: '100%' }}>
                            <CardContent sx={{ pb: 1 }}>
                              <Typography variant="body2" noWrap>
                                {file.name}
                              </Typography>
                            </CardContent>
                            <CardActions>
                              <Button
                                size="small"
                                onClick={() => handlePreview(file)}
                              >
                                Preview Rename
                              </Button>
                            </CardActions>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default BatchRenamePage; 
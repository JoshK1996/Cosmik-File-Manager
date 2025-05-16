import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Paper,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  Storage as StorageIcon,
  Add as AddIcon,
  Folder as FolderIcon,
  SdStorage as SdStorageIcon,
  History as HistoryIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useStore } from '../store';

const HomePage = () => {
  const { 
    drives, 
    recentlyConnectedDrive, 
    createNewProject, 
    setCurrentProject,
    recentProjects,
    removeFromRecentProjects,
    isLoading
  } = useStore();
  
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [selectProjectDialogOpen, setSelectProjectDialogOpen] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [notification, setNotification] = useState(null);
  
  const navigate = useNavigate();
  
  const handleCreateProject = async () => {
    if (!selectedDrive || !projectName.trim()) return;
    
    const result = await createNewProject(selectedDrive.description, projectName);
    
    if (result.success) {
      setNotification({
        type: 'success',
        message: `Project "${projectName}" created successfully!`
      });
      setNewProjectDialogOpen(false);
      setProjectName('');
      navigate('/project/current');
    } else {
      setNotification({
        type: 'error',
        message: `Failed to create project: ${result.error}`
      });
    }
  };
  
  const handleSelectProject = async (directoryPath) => {
    await setCurrentProject(directoryPath);
    setSelectProjectDialogOpen(false);
    navigate('/project/current');
  };
  
  const handleOpenSelectProjectDialog = (drive) => {
    setSelectedDrive(drive);
    setSelectProjectDialogOpen(true);
  };
  
  const handleOpenNewProjectDialog = (drive) => {
    setSelectedDrive(drive);
    setNewProjectDialogOpen(true);
  };
  
  const handleBrowseForProject = async () => {
    const projectPath = await window.api.openDirectoryDialog();
    
    if (projectPath) {
      await handleSelectProject(projectPath);
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
      
      {/* Recent Projects Section */}
      {recentProjects && recentProjects.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 1 }} />
            Recent Projects
          </Typography>
          
          <Grid container spacing={2}>
            {recentProjects.map((project, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <FolderIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" noWrap>
                        {project.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {project.path}
                    </Typography>
                    {project.lastOpened && (
                      <Typography variant="body2" color="text.secondary">
                        Last opened: {new Date(project.lastOpened).toLocaleDateString()}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      variant="contained"
                      onClick={() => handleSelectProject(project.path)}
                    >
                      Open
                    </Button>
                    <Button 
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => {
                        removeFromRecentProjects(project.path);
                        setNotification({
                          type: 'info',
                          message: `Removed "${project.name}" from recent projects`
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
      
      {recentlyConnectedDrive && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mb: 4, 
            backgroundColor: 'primary.dark',
            color: 'white' 
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SdStorageIcon sx={{ fontSize: 40, mr: 2 }} />
            <Box>
              <Typography variant="h6">
                New Drive Detected: {recentlyConnectedDrive.name} {recentlyConnectedDrive.volumename}
              </Typography>
              <Typography variant="body2">
                {recentlyConnectedDrive.description}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={() => handleOpenNewProjectDialog(recentlyConnectedDrive)}
            >
              Create New Project
            </Button>
            <Button 
              variant="outlined" 
              sx={{ color: 'white', borderColor: 'white' }}
              onClick={() => handleOpenSelectProjectDialog(recentlyConnectedDrive)}
            >
              Select Existing Project
            </Button>
          </Box>
        </Paper>
      )}
      
      <Typography variant="h4" gutterBottom>
        Available Drives
      </Typography>
      
      <Grid container spacing={3}>
        {drives.map((drive, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <StorageIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" component="div">
                    {drive.name} {drive.volumename}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {drive.description || 'Local Disk'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {drive.filesystem || 'Unknown'} File System
                </Typography>
                {drive.size && (
                  <Typography variant="body2" color="text.secondary">
                    Size: {Math.round(drive.size / (1024 * 1024 * 1024))} GB
                  </Typography>
                )}
                {drive.freespace && (
                  <Typography variant="body2" color="text.secondary">
                    Free: {Math.round(drive.freespace / (1024 * 1024 * 1024))} GB
                  </Typography>
                )}
              </CardContent>
              <Divider />
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenNewProjectDialog(drive)}
                >
                  New Project
                </Button>
                <Button 
                  size="small" 
                  startIcon={<FolderIcon />}
                  onClick={() => handleOpenSelectProjectDialog(drive)}
                >
                  Select Project
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleBrowseForProject}
          startIcon={<FolderIcon />}
        >
          Browse for Project Folder
        </Button>
      </Box>
      
      {/* Create New Project Dialog */}
      <Dialog open={newProjectDialogOpen} onClose={() => setNewProjectDialogOpen(false)}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Drive: {selectedDrive?.name} {selectedDrive?.volumename}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Location: {selectedDrive?.description}
            </Typography>
          </Box>
          <TextField
            autoFocus
            margin="dense"
            id="project-name"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProjectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateProject} 
            variant="contained"
            disabled={!projectName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Select Project Dialog */}
      <Dialog 
        open={selectProjectDialogOpen} 
        onClose={() => setSelectProjectDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Select Project Folder</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Please select a project folder or click "Browse" to navigate to a specific folder.
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleBrowseForProject}
            sx={{ mb: 2 }}
          >
            Browse
          </Button>
          
          {/* Show recent projects in the dialog as well */}
          {recentProjects && recentProjects.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Recent Projects
              </Typography>
              <List dense>
                {recentProjects.map((project, index) => (
                  <ListItem 
                    key={index}
                    button
                    onClick={() => handleSelectProject(project.path)}
                    sx={{ 
                      borderRadius: 1,
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    <ListItemIcon>
                      <FolderIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={project.name}
                      secondary={project.path}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectProjectDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomePage; 
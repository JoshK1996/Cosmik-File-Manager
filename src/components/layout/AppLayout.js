import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  Drawer, 
  Toolbar, 
  Typography, 
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  FolderOpen as FolderIcon,
  EditRoad as EditIcon,
  VideoLibrary as VideoIcon
} from '@mui/icons-material';
import { useStore } from '../../store';

const drawerWidth = 240;

const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { errorMessage, clearError } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };
  
  const drawer = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Cosmik File Manager
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding selected={location.pathname === '/'}>
          <ListItemButton onClick={() => handleNavigation('/')}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding selected={location.pathname.includes('/project')}>
          <ListItemButton onClick={() => handleNavigation('/project/current')}>
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary="Project Files" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding selected={location.pathname === '/batch-rename'}>
          <ListItemButton onClick={() => handleNavigation('/batch-rename')}>
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            <ListItemText primary="Batch Rename" />
          </ListItemButton>
        </ListItem>
        
        <ListItem disablePadding selected={location.pathname === '/media-player'}>
          <ListItemButton onClick={() => handleNavigation('/media-player')}>
            <ListItemIcon>
              <VideoIcon />
            </ListItemIcon>
            <ListItemText primary="Media Player" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            {location.pathname === '/' && 'Dashboard'}
            {location.pathname.includes('/project') && 'Project Management'}
            {location.pathname === '/batch-rename' && 'Batch Rename Tool'}
            {location.pathname === '/media-player' && 'Media Player'}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth 
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto'
        }}
      >
        <Toolbar /> {/* Add space for fixed app bar */}
        {children}
      </Box>
      
      {/* Error Messages */}
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={clearError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={clearError} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppLayout; 
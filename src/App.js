import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useStore } from './store';

// Components
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import ProjectPage from './pages/ProjectPage';
import BatchRenamePage from './pages/BatchRenamePage';
import MediaPlayerPage from './pages/MediaPlayerPage';

// Create a theme instance
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  const { initializeDriveWatcher, initializeFromLocalStorage } = useStore();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Start watching for drive changes when the app loads
    initializeDriveWatcher();
    
    // Load saved data from localStorage
    initializeFromLocalStorage();
    
    setInitialized(true);
    
    // Clean up when the app unmounts
    return () => {
      window.api.stopDriveWatcher();
    };
  }, [initializeDriveWatcher, initializeFromLocalStorage]);
  
  if (!initialized) {
    return <div>Loading application...</div>;
  }
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/project/:id" element={<ProjectPage />} />
            <Route path="/batch-rename" element={<BatchRenamePage />} />
            <Route path="/media-player" element={<MediaPlayerPage />} />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App; 
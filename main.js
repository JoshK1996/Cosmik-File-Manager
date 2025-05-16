const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Allow loading local resources
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadURL(
    isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, './build/index.html')}`
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register file protocol handler
  protocol.registerFileProtocol('file', (request, callback) => {
    const url = request.url.substr(7); // remove the 'file://' part
    callback({ path: path.normalize(decodeURI(url)) });
  });
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle drive detection
ipcMain.handle('get-drives', async () => {
  // Windows drive detection
  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      require('child_process').exec('wmic logicaldisk get name,volumename,description,filesystem,size,freespace', (error, stdout) => {
        if (error) {
          console.error(error);
          resolve([]);
          return;
        }
        
        const lines = stdout.trim().split('\r\r\n').filter(Boolean);
        const headers = lines[0].trim().split(/\s{2,}/);
        const drives = [];
        
        for(let i = 1; i < lines.length; i++) {
          const values = lines[i].trim().split(/\s{2,}/);
          const drive = {};
          
          for(let j = 0; j < headers.length && j < values.length; j++) {
            drive[headers[j].toLowerCase()] = values[j];
          }
          
          drives.push(drive);
        }
        
        resolve(drives);
      });
    });
  } else {
    // Unix-like systems
    const drives = [];
    const mountpoints = fs.readFileSync('/proc/mounts', 'utf-8')
      .split('\n')
      .filter(line => line.startsWith('/dev/'));
      
    mountpoints.forEach(line => {
      const parts = line.split(' ');
      if (parts.length >= 2) {
        drives.push({
          name: parts[0],
          volumename: '',
          description: parts[1],
          filesystem: parts[2],
          size: '',
          freespace: ''
        });
      }
    });
    
    return drives;
  }
});

// Open directory dialog
ipcMain.handle('open-directory-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return null;
  }
  
  return result.filePaths[0];
});

// Create directory
ipcMain.handle('create-directory', async (event, dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// List directory contents
ipcMain.handle('list-directory', async (event, dirPath) => {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const contents = items.map(item => {
      const itemPath = path.join(dirPath, item.name);
      const stats = fs.statSync(itemPath);
      
      return {
        name: item.name,
        path: itemPath,
        isDirectory: item.isDirectory(),
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });
    
    return { success: true, contents };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Move file
ipcMain.handle('move-file', async (event, sourcePath, destinationPath) => {
  try {
    console.log(`Attempting to move file from ${sourcePath} to ${destinationPath}`);
    
    // Check if source file exists
    if (!fs.existsSync(sourcePath)) {
      console.error(`Source file does not exist: ${sourcePath}`);
      return { success: false, error: `Source file does not exist: ${sourcePath}` };
    }
    
    // Normalize paths to use platform-specific separators
    sourcePath = path.normalize(sourcePath);
    destinationPath = path.normalize(destinationPath);
    
    // Check for path issues
    // 1. Check for mixed slashes or duplicate drive letters
    if (destinationPath.includes('/') && destinationPath.includes('\\')) {
      console.log(`Invalid destination path format: ${destinationPath}`);
      
      // Extract the drive letter and base path correctly
      const driveLetter = destinationPath.charAt(0);
      
      // Check if the path has a duplicated drive path
      if (destinationPath.indexOf(driveLetter + ':') !== destinationPath.lastIndexOf(driveLetter + ':')) {
        // Path contains duplicate drive letter - extract the actual target path
        // Find position of the second drive letter occurrence
        const secondDrivePos = destinationPath.indexOf(driveLetter + ':', 2);
        
        // Get everything after that (the actual intended path)
        const actualPath = destinationPath.substring(secondDrivePos);
        
        console.log(`Sanitized path: ${actualPath}`);
        destinationPath = actualPath;
      } else {
        // Just normalize the path if it's only a slash issue
        destinationPath = path.normalize(destinationPath);
      }
      
      console.log(`Updated destination: ${destinationPath}`);
    }
    
    // Ensure destination directory exists
    const destinationDir = path.dirname(destinationPath);
    if (!fs.existsSync(destinationDir)) {
      console.log(`Creating destination directory: ${destinationDir}`);
      fs.mkdirSync(destinationDir, { recursive: true });
    }
    
    // Check if destination is the same as source
    if (sourcePath === destinationPath) {
      console.log(`Source and destination are the same file`);
      return { success: true, message: 'File already in correct location' };
    }
    
    // Check if destination file already exists
    if (fs.existsSync(destinationPath)) {
      console.log(`Destination file already exists: ${destinationPath}`);
      
      // Compare if they're the same file
      const sourceStats = fs.statSync(sourcePath);
      const destStats = fs.statSync(destinationPath);
      
      if (sourceStats.size === destStats.size && 
          sourceStats.mtime.getTime() === destStats.mtime.getTime()) {
        console.log('Source and destination are the same file');
        return { success: true, message: 'File already exists in destination with same content' };
      }
      
      // If different files, rename the destination by appending timestamp
      const extname = path.extname(destinationPath);
      const basename = path.basename(destinationPath, extname);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '');
      const newDestPath = path.join(path.dirname(destinationPath), `${basename}_${timestamp}${extname}`);
      
      console.log(`Renaming existing file to: ${newDestPath}`);
      fs.renameSync(destinationPath, newDestPath);
    }
    
    // Perform the move
    fs.copyFileSync(sourcePath, destinationPath);
    fs.unlinkSync(sourcePath);
    
    return { success: true };
  } catch (error) {
    console.error(`Error moving file: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Rename files
ipcMain.handle('rename-files', async (event, files, pattern, replacements) => {
  try {
    const results = [];
    
    for (const file of files) {
      const dir = path.dirname(file);
      const oldName = path.basename(file);
      let newName = oldName;
      
      // Apply replacements
      if (pattern && replacements) {
        const regex = new RegExp(pattern, 'g');
        newName = oldName.replace(regex, replacements);
      }
      
      const newPath = path.join(dir, newName);
      
      if (oldName !== newName) {
        fs.renameSync(file, newPath);
        results.push({ oldPath: file, newPath });
      }
    }
    
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Watch for drive changes
let driveWatcher;

ipcMain.handle('start-drive-watcher', async () => {
  if (driveWatcher) {
    clearInterval(driveWatcher);
  }
  
  let previousDrives = [];
  
  // For Windows, we'll poll for drive changes
  if (process.platform === 'win32') {
    driveWatcher = setInterval(async () => {
      // Call the get-drives handler directly instead of using ipcMain.handlers
      const getDrivesHandler = ipcMain._handlers?.['get-drives'];
      let currentDrives = [];
      
      if (getDrivesHandler) {
        try {
          currentDrives = await getDrivesHandler();
        } catch (error) {
          console.error('Error getting drives:', error);
        }
      }
      
      const currentDriveNames = currentDrives.map(drive => drive.name);
      const previousDriveNames = previousDrives.map(drive => drive.name);
      
      // Find new drives
      const newDrives = currentDrives.filter(drive => 
        !previousDriveNames.includes(drive.name)
      );
      
      // Find removed drives
      const removedDrives = previousDrives.filter(drive => 
        !currentDriveNames.includes(drive.name)
      );
      
      if (newDrives.length > 0 || removedDrives.length > 0) {
        mainWindow.webContents.send('drives-changed', {
          added: newDrives,
          removed: removedDrives,
          all: currentDrives
        });
      }
      
      previousDrives = currentDrives;
    }, 2000); // Check every 2 seconds
  }
  
  return { success: true };
});

ipcMain.handle('stop-drive-watcher', async () => {
  if (driveWatcher) {
    clearInterval(driveWatcher);
    driveWatcher = null;
  }
  
  return { success: true };
}); 
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Drive operations
    getDrives: () => ipcRenderer.invoke('get-drives'),
    startDriveWatcher: () => ipcRenderer.invoke('start-drive-watcher'),
    stopDriveWatcher: () => ipcRenderer.invoke('stop-drive-watcher'),
    onDrivesChanged: (callback) => {
      ipcRenderer.on('drives-changed', (_, data) => callback(data));
      return () => {
        ipcRenderer.removeAllListeners('drives-changed');
      };
    },
    
    // Directory operations
    openDirectoryDialog: () => ipcRenderer.invoke('open-directory-dialog'),
    createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
    listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', dirPath),
    
    // File operations
    moveFile: (sourcePath, destinationPath) => 
      ipcRenderer.invoke('move-file', sourcePath, destinationPath),
    renameFiles: (files, pattern, replacements) => 
      ipcRenderer.invoke('rename-files', files, pattern, replacements),
      
    // Video operations
    analyzeVideo: (filePath) => ipcRenderer.invoke('analyze-video', filePath),
      
    // Video player operations
    openVideo: (filePath) => ipcRenderer.invoke('open-video', filePath)
  }
); 
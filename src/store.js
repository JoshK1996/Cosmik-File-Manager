import { create } from 'zustand';
import path from 'path-browserify';

const useStore = create((set, get) => ({
  // Drive state
  drives: [],
  recentlyConnectedDrive: null,
  
  // Project state
  currentProject: null,
  projectFiles: [],
  projectFolders: [],
  recentProjects: [], // New state for recently used projects
  
  // H and V folders
  hFolder: null,
  vFolder: null,
  
  // Files state
  hFiles: [],
  vFiles: [],
  orphanedHFiles: [], // H files without V counterparts
  orphanedVFiles: [], // V files without H counterparts
  selectedFiles: [],
  
  // UI state
  isLoading: false,
  errorMessage: null,
  
  // Actions
  initializeDriveWatcher: () => {
    window.api.startDriveWatcher();
    window.api.onDrivesChanged((driveData) => {
      set({ 
        drives: driveData.all,
        recentlyConnectedDrive: driveData.added.length > 0 ? driveData.added[0] : null
      });
    });
    
    // Get initial drives
    window.api.getDrives().then(drives => {
      set({ drives });
    });
  },
  
  setCurrentProject: async (projectPath) => {
    set({ isLoading: true, currentProject: projectPath });
    
    try {
      // Analyze project structure
      await get().analyzeProjectStructure(projectPath);
      
      // Add to recent projects
      get().addToRecentProjects(projectPath);
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        isLoading: false, 
        errorMessage: `Failed to load project: ${error.message}` 
      });
    }
  },
  
  createNewProject: async (parentPath, projectName) => {
    set({ isLoading: true });
    
    try {
      const projectPath = path.join(parentPath, projectName);
      
      // Create project directory
      await window.api.createDirectory(projectPath);
      
      // Create H and V folders
      await window.api.createDirectory(path.join(projectPath, 'H'));
      await window.api.createDirectory(path.join(projectPath, 'V'));
      
      // Set as current project
      await get().setCurrentProject(projectPath);
      
      set({ isLoading: false });
      return { success: true, path: projectPath };
    } catch (error) {
      set({ 
        isLoading: false, 
        errorMessage: `Failed to create project: ${error.message}`
      });
      return { success: false, error: error.message };
    }
  },
  
  analyzeProjectStructure: async (projectPath) => {
    // Get all files in the project directory recursively
    const scanDirectory = async (dirPath, baseDir = '') => {
      const result = await window.api.listDirectory(dirPath);
      
      if (!result.success) {
        throw new Error(`Failed to read directory: ${result.error}`);
      }
      
      let files = [];
      let folders = [];
      
      for (const item of result.contents) {
        const relativePath = path.join(baseDir, item.name);
        
        if (item.isDirectory) {
          folders.push({
            name: item.name,
            path: item.path,
            relativePath
          });
          
          // Scan subdirectory
          const subResults = await scanDirectory(item.path, relativePath);
          files = [...files, ...subResults.files];
          folders = [...folders, ...subResults.folders];
        } else {
          files.push({
            name: item.name,
            path: item.path,
            relativePath,
            size: item.size,
            lastModified: item.lastModified
          });
        }
      }
      
      return { files, folders };
    };
    
    try {
      set({ isLoading: true, errorMessage: null });
      
      // Scan the entire project directory recursively
      const { files, folders } = await scanDirectory(projectPath);
      
      // Find H and V folders anywhere in the project
      const hFolder = folders.find(folder => folder.name === "H");
      const vFolder = folders.find(folder => folder.name === "V");
      
      console.log("Found folders in project:", folders.map(f => f.path));
      console.log("H folder:", hFolder ? hFolder.path : "Not found");
      console.log("V folder:", vFolder ? vFolder.path : "Not found");
      
      // Find H and V files
      const hFiles = files.filter(file => file.name.includes(" - H"));
      const vFiles = files.filter(file => file.name.includes(" - V"));
      
      // Identify orphaned files (files without a counterpart)
      const hFilesWithoutV = hFiles.filter(hFile => {
        // Extract base name without the " - H" suffix
        const hBaseName = hFile.name.replace(/ - H(\.\w+)?$/, "");
        
        // Check if there's a matching V file
        return !vFiles.some(vFile => {
          const vBaseName = vFile.name.replace(/ - V(\.\w+)?$/, "");
          // Compare base names without the suffixes
          return vBaseName === hBaseName;
        });
      });
      
      const vFilesWithoutH = vFiles.filter(vFile => {
        // Extract base name without the " - V" suffix
        const vBaseName = vFile.name.replace(/ - V(\.\w+)?$/, "");
        
        // Check if there's a matching H file
        return !hFiles.some(hFile => {
          const hBaseName = hFile.name.replace(/ - H(\.\w+)?$/, "");
          // Compare base names without the suffixes
          return hBaseName === vBaseName;
        });
      });
      
      set({
        currentProject: {
          path: projectPath,
          name: path.basename(projectPath)
        },
        projectFiles: files,
        projectFolders: folders,
        hFolder,
        vFolder,
        hFiles,
        vFiles,
        orphanedHFiles: hFilesWithoutV,
        orphanedVFiles: vFilesWithoutH,
        isLoading: false
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error analyzing project structure:", error);
      set({ 
        isLoading: false, 
        errorMessage: `Failed to analyze project structure: ${error.message}` 
      });
      return { success: false, error: error.message };
    }
  },
  
  moveFilesToHVFolders: async () => {
    set({ isLoading: true });
    
    try {
      const { currentProject, hFiles, vFiles, projectFolders } = get();
      
      if (!currentProject) {
        throw new Error('No project is currently open');
      }
      
      // Find H and V folders in the project
      let hFolder = projectFolders.find(folder => folder.name === "H");
      let vFolder = projectFolders.find(folder => folder.name === "V");
      
      // Create H and V folders at the project root if they don't exist anywhere in the project
      if (!hFolder) {
        console.log("H folder not found, creating at project root");
        const createHResult = await window.api.createDirectory(path.join(currentProject.path, "H"));
        if (!createHResult.success) {
          throw new Error(`Failed to create H folder: ${createHResult.error}`);
        }
        hFolder = {
          name: "H",
          path: path.join(currentProject.path, "H"),
          relativePath: "H"
        };
      }
      
      if (!vFolder) {
        console.log("V folder not found, creating at project root");
        const createVResult = await window.api.createDirectory(path.join(currentProject.path, "V"));
        if (!createVResult.success) {
          throw new Error(`Failed to create V folder: ${createVResult.error}`);
        }
        vFolder = {
          name: "V",
          path: path.join(currentProject.path, "V"),
          relativePath: "V"
        };
      }
      
      console.log('Moving files to H/V folders');
      console.log(`H folder: ${hFolder.path}`);
      console.log(`V folder: ${vFolder.path}`);
      console.log(`H files count: ${hFiles.length}`);
      console.log(`V files count: ${vFiles.length}`);
      
      const results = {
        hMoved: 0,
        vMoved: 0,
        hErrors: [],
        vErrors: []
      };
      
      // Move H files
      for (const file of hFiles) {
        const targetPath = path.join(hFolder.path, file.name);
        
        // Skip if the file is already in the H folder
        if (file.path === targetPath) {
          console.log(`File ${file.name} already in H folder, skipping`);
          continue;
        }
        
        console.log(`Moving H file from ${file.path} to ${targetPath}`);
        
        const moveResult = await window.api.moveFile(file.path, targetPath);
        if (moveResult.success) {
          results.hMoved++;
        } else {
          results.hErrors.push({
            file: file.name,
            error: moveResult.error
          });
        }
      }
      
      // Move V files
      for (const file of vFiles) {
        const targetPath = path.join(vFolder.path, file.name);
        
        // Skip if the file is already in the V folder
        if (file.path === targetPath) {
          console.log(`File ${file.name} already in V folder, skipping`);
          continue;
        }
        
        console.log(`Moving V file from ${file.path} to ${targetPath}`);
        
        const moveResult = await window.api.moveFile(file.path, targetPath);
        if (moveResult.success) {
          results.vMoved++;
        } else {
          results.vErrors.push({
            file: file.name,
            error: moveResult.error
          });
        }
      }
      
      // Re-analyze project after moving files
      await get().analyzeProjectStructure(currentProject.path);
      
      set({ isLoading: false });
      
      return {
        success: true,
        results
      };
    } catch (error) {
      console.error("Error moving files:", error);
      set({ 
        isLoading: false, 
        errorMessage: `Failed to move files: ${error.message}` 
      });
      return { success: false, error: error.message };
    }
  },
  
  batchRenameFiles: async (files, pattern, replacement) => {
    set({ isLoading: true });
    
    try {
      const result = await window.api.renameFiles(
        files.map(f => f.path), 
        pattern, 
        replacement
      );
      
      if (result.success) {
        // Refresh project structure
        const { currentProject } = get();
        if (currentProject) {
          await get().analyzeProjectStructure(currentProject.path);
        }
      }
      
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({ 
        isLoading: false, 
        errorMessage: `Failed to rename files: ${error.message}`
      });
      return { success: false, error: error.message };
    }
  },
  
  setSelectedFiles: (files) => {
    if (!files || files.length === 0) {
      localStorage.removeItem('selectedFiles');
      set({ selectedFiles: [] });
      return;
    }
    
    // Store the selected files in localStorage to persist across page navigation
    try {
      // We only need to store essential information to avoid storage limits
      const filesData = files.map(file => ({
        name: file.name,
        path: file.path,
        size: file.size || 0,
        lastModified: file.lastModified || Date.now()
      }));
      
      console.log('Saving selected files to localStorage:', filesData.length);
      localStorage.setItem('selectedFiles', JSON.stringify(filesData));
    } catch (error) {
      console.error('Failed to save selected files to localStorage:', error);
    }
    
    set({ selectedFiles: files });
  },
  
  // Add a project to recent projects
  addToRecentProjects: (projectPath) => {
    const { recentProjects } = get();
    
    // Create a project object
    const project = {
      path: projectPath,
      name: path.basename(projectPath),
      lastOpened: new Date().toISOString()
    };
    
    // Remove the project if it already exists in the list
    const updatedProjects = recentProjects.filter(p => p.path !== projectPath);
    
    // Add the project to the beginning of the list
    updatedProjects.unshift(project);
    
    // Limit to 10 recent projects
    const limitedProjects = updatedProjects.slice(0, 10);
    
    // Update state
    set({ recentProjects: limitedProjects });
    
    // Save to localStorage
    try {
      localStorage.setItem('recentProjects', JSON.stringify(limitedProjects));
    } catch (error) {
      console.error('Failed to save recent projects to localStorage:', error);
    }
  },
  
  // Remove a project from recent projects
  removeFromRecentProjects: (projectPath) => {
    const { recentProjects } = get();
    
    // Filter out the project
    const updatedProjects = recentProjects.filter(p => p.path !== projectPath);
    
    // Update state
    set({ recentProjects: updatedProjects });
    
    // Save to localStorage
    try {
      localStorage.setItem('recentProjects', JSON.stringify(updatedProjects));
    } catch (error) {
      console.error('Failed to save recent projects to localStorage:', error);
    }
  },
  
  // Initialize store data from localStorage if available
  initializeFromLocalStorage: () => {
    try {
      // Load selected files
      const selectedFilesData = localStorage.getItem('selectedFiles');
      if (selectedFilesData) {
        const parsedData = JSON.parse(selectedFilesData);
        console.log('Loaded selected files from localStorage:', parsedData.length);
        set({ selectedFiles: parsedData });
      }
      
      // Load recent projects
      const recentProjectsData = localStorage.getItem('recentProjects');
      if (recentProjectsData) {
        const parsedProjects = JSON.parse(recentProjectsData);
        console.log('Loaded recent projects from localStorage:', parsedProjects.length);
        set({ recentProjects: parsedProjects });
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  },
  
  clearError: () => {
    set({ errorMessage: null });
  }
}));

export { useStore }; 
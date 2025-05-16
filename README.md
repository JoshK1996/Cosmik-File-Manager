# Cosmik File Manager

A modern file management application for organizing media files, automatically detecting and organizing horizontal (H) and vertical (V) video files.

## Features

- **Drive Detection**: Automatically detects when external drives are connected to the PC
- **Project Management**: Create new projects or select existing project folders
- **File Organization**: Automatically creates H and V folders if they don't exist, and moves files with " - H" and " - V" in their names to the appropriate folders
- **File Verification**: Detects and highlights files that are missing their counterparts (H files without V files and vice versa)
- **Built-in Media Player**: Watch video files directly in the application
- **Batch Renaming**: Powerful batch rename tool with preview functionality
- **Modern UI/UX**: Clean, intuitive interface with dark mode

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/cosmik-file-manager.git
   cd cosmik-file-manager
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the application in development mode:
   ```
   npm run dev
   ```

4. Build for production:
   ```
   npm run build
   ```

## Usage

### Home Screen

The home screen displays all connected drives. When an external drive is connected, it will be highlighted at the top of the screen. You can:

- Create a new project on any drive
- Select an existing project from any drive
- Browse for a project folder anywhere on your computer

### Project Management

Once a project is loaded, the application will:

1. Analyze the project structure
2. Create H and V folders if they don't exist
3. Identify files with " - H" and " - V" in their names
4. Check for missing counterparts (showing warnings for files without matches)

Use the "Organize Files" button to automatically move H and V files to their respective folders.

### Batch Rename

The batch rename tool provides several options:

- **Find and Replace**: Replace specific text in filenames
- **Add Prefix/Suffix**: Add text before or after filenames
- **Add Numbering**: Add sequential numbers to filenames

All changes can be previewed before applying.

### Media Player

The built-in media player allows you to:

- Watch video files directly in the application
- Navigate between files in a playlist
- Control playback (play, pause, volume, fullscreen)

## Development

This application is built with:

- Electron - Cross-platform desktop application framework
- React - UI library
- Material-UI - Component library
- Zustand - State management

## License

MIT 
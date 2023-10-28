const { app, BrowserWindow, dialog, ipcMain } = require('electron');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'Production Manager',
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
  });

  mainWindow.loadFile('renderer/index.html');

  mainWindow.maximize();
  mainWindow.show();
  mainWindow.setMinimumSize(1000, 600);
  mainWindow.menuBarVisible = false;
}

function openFileDialog() {
  const options = {
    title: 'Select a File',
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  };

  dialog
    .showOpenDialog(options)
    .then((result) => {
      if (!result.canceled) {
        const filePath = result.filePaths[0];
        console.log('Selected file:', filePath);

        mainWindow.webContents.send('selected-file', filePath);
      }
    })
    .catch((err) => {
      console.error('Error opening file dialog:', err);
    });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

ipcMain.on('open-file-dialog', () => {
  openFileDialog();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') 
  {
    app.quit();
  }
});

/*
async function checkForUpdates() {
  const response = await fetch('https://example.com/updates.json');
  const updates = await response.json();

  const currentVersion = require('./package.json').version;
  const latestVersion = updates.latestVersion;

  if (latestVersion > currentVersion) {
    const downloadUrl = updates.downloadUrl;
    const response = await fetch(downloadUrl);
    const appZip = await response.buffer();

    const extract = require('extract-zip');
    await extract(appZip, './');

    const fs = require('fs');
    fs.cpSync('./app/', './');

    require('electron').app.relaunch();
  }
}

setInterval(checkForUpdates, 3600000);
*/
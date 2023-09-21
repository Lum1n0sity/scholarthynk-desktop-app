const path = require('path');
const { app, BrowserWindow } = require('electron');


function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: 'Production Manager',
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.maximize();
  mainWindow.show();
  mainWindow.setMinimumSize(1000, 600);
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
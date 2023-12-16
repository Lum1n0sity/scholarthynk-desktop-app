const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();

let mainWindow;
let pwResetWin;

async function createMainWindow() 
{
  mainWindow = new BrowserWindow({
    title: 'ScholarThynk',
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
    },
  });

  mainWindow.loadFile('renderer/UI/Login/login.html');

  mainWindow.maximize();
  mainWindow.show();
  mainWindow.setMinimumSize(1000, 600);
  mainWindow.menuBarVisible = true;
}

function createPWResetWin()
{
  pwResetWin = new BrowserWindow({
    title: 'ScholarThynk - Password Reset',
    width: 500,
    height: 550,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    },
  });

  pwResetWin.loadFile('renderer/UI/PWReset/code.html');

  pwResetWin.show();
  pwResetWin.setMinimumSize(500, 600);
  pwResetWin.setMinimizable = false;
  pwResetWin.menuBarVisible = true;
}

function openFileDialog() 
{
  const options = {
    title: 'Select a File',
    filters: [
      { name: 'PNG Files', extensions: ['png'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  };

  dialog
    .showOpenDialog(options)
    .then((result) => {
      if (!result.canceled) 
      {
        const filePath = result.filePaths[0];
        mainWindow.webContents.send('selected-file', filePath);
      } 
      else 
      {
        mainWindow.webContents.send('file-dialog-canceled');
      }
    })
    .catch((err) => {
      console.error('Error opening file dialog:', err);
    });
}

app.whenReady().then(() => {
  store.set('loggedOut', false);

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) 
    {
      createMainWindow();
    }
  });

  ipcMain.on('reset', () => {
    pwResetWin.close();
    pwResetWin = null;
    mainWindow.webContents.send('update-dummy');
  })
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

ipcMain.on('email-received', () => {
  createPWResetWin();
});
const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();
const { existsSync, readFileSync } = require('fs');
const { resolve } = require('path');
const i18next = require('i18next');
const HttpBackend = require('i18next-http-backend');
const yaml = require('js-yaml');

let mainWindow;

function sendLanguageChange(language) {
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('language-changed', language);
  });
}

function createMainWindow() 
{
  mainWindow = new BrowserWindow({
    title: 'School-Manager',
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

try 
{
  console.log('Configuring i18next...');
  i18next
  .use(HttpBackend)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    ns: ['app'],
    defaultNS: 'app',
    backend: {
      loadPath: 'C:/DatenLokal/Development/Work/VBTrainerDesktopApp/renderer/Translation/{{lng}}.{{ns}}.json',
    },
  });

  console.log('Configuring done');
}
catch (error)
{
  console.error('Error configuring i18next: ', error);
}

ipcMain.on('change-language', (event, language) => {
  i18next.changeLanguage(language, (err, t) => {
    sendLanguageChange(language);
  });
});

ipcMain.on('get-language', (event) => {
  event.sender.send('language', i18next.language);
});
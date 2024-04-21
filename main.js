const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();
const path = require('path');
const fs = require('fs');

let mainWindow;
let pwResetWin;
let teacherVerificationWin;
let devVerificationWin;

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
  pwResetWin.menuBarVisible = false;
}
  
function teacherVerification()
{
  teacherVerificationWin = new BrowserWindow({
    title: 'ScholarThynk - Verification',
    width: 500,
    height: 550,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    },
  });

  teacherVerificationWin.loadFile('renderer/UI/RegisterVerification/teacher/email/email.html');

  teacherVerificationWin.show();
  teacherVerificationWin.setMinimumSize(500, 500);
  teacherVerificationWin.setMinimizable = false;
  teacherVerificationWin.menuBarVisible = true;
}

function devVerification()
{
  devVerificationWin = new BrowserWindow({
    title: 'ScholarThynk - Verification',
    width: 500,
    height: 550,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    },
  });

  devVerificationWin.loadFile('renderer/UI/RegisterVerification/dev/code.html');

  devVerificationWin.show();
  devVerificationWin.setMinimumSize(500, 600);
  devVerificationWin.setMinimizable = false;
  devVerificationWin.menuBarVisible = true;
}

function openFileDialog() 
{
  const options = {
    title: 'Select a File',
    filters: [
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

  ipcMain.on('teacher-verified', () => {
    console.log('debug');
    teacherVerificationWin.close();
    teacherVerificationWin = null;
    mainWindow.webContents.send('registration-successfull');
  });
});

ipcMain.on('open-file-dialog', () => {
  openFileDialog();
});

app.on('before-quit', () => {
  const username = store.get('username');
  const userData = ({ username: username });

  fetch('http://192.168.5.196:3000/user/updateStatus', {
      method: 'POST',
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify(userData)
  })
  .then(response => response.json())
  .catch(error => {
      console.error('Fetch error: ', error);
  });
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

ipcMain.on('verify-teacher', () => {
  teacherVerification();
});

ipcMain.on('verify-dev', () => {
  devVerification();
});

ipcMain.on('download-file', (event, content, fileName) => {
  const filePath = path.join(app.getPath('downloads'), fileName);
  fs.writeFileSync(filePath, content);
  event.sender.send('download-ready', fileName, filePath);
});
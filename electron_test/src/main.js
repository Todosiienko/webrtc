const { app, BrowserWindow, desktopCapturer, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false
    }
  });

  // allow getDisplayMedia
  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      desktopCapturer.getSources({ types: ['screen', 'window'] }).then(sources => {
        callback({ video: sources[0], audio: null });
      });
    }
  );
  win.webContents.openDevTools();
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // macOS doesn't quit when yoy close all windows 
  if (process.platform !== 'darwin') app.quit();
});

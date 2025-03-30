const { app, BrowserWindow, ipcMain } = require('electron/main');
const path = require('path');
// const os = require('os');

// if (os.platform() === 'darwin' && os.arch() === 'x64') {
//   app.disableHardwareAcceleration();
// }

app.commandLine.appendSwitch('enable-unsafe-webgpu');
/** @type {BrowserWindow} */
let win = null;

const createWindow = () => {
  win = new BrowserWindow({
    width: 1280,
    height: 806,
    // minWidth: 1280,
    // minHeight: 806,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'js/electron.preload.js'),
      devTools: true
    },
    title: 'TV Browser'
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  ipcMain.on('makeRequest', (event, arg) => {
    if (!arg || typeof arg !== 'object' || !arg.url) {
      console.error('Invalid argument received');
      return;
    }

    console.log(`Handling request for URL: ${arg.url}`);

    fetch(arg.url, arg.options).then(async response => {
      console.log(`Received response for URL: ${arg.url}`);
      try {
        if (response.ok || response.status === 302) {
          const data = await response.text();
          event.returnValue = { data, error: null };
        }
        else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error processing response text:', error);
        event.returnValue = { data: null, error: 'Error processing response text' };
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      event.returnValue = { data: null, error };
    });
  });

  ipcMain.on('changeTitle', (event, title) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win.setTitle(title);
  });

  ipcMain.on('putOnTop', (event, isOnTop) => {
    win.setAlwaysOnTop(isOnTop);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

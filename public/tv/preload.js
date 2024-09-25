const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  makeRequest: (url, options = {}) => {
    const response = ipcRenderer.sendSync('makeRequest', { url, options });
    return response;
  },
  changeTitle: (title) => ipcRenderer.send('changeTitle', title)
});

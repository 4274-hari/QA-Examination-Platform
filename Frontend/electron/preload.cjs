const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('appEnv', {
  isElectron: true,
  platform: process.platform
})

contextBridge.exposeInMainWorld('electronAPI', {
  // Listen for violation events from main process
  onViolation: (callback) => {
    ipcRenderer.on('VIOLATION_DETECTED', (event, data) => {
      callback(data.type, data.message)
    })
  },

  // Listen for focus regain
  onFocusRegained: (callback) => {
    ipcRenderer.on('FOCUS_REGAINED', callback)
  },

  // Register a violation with the main process
  registerViolation: (type, message) => {
    return ipcRenderer.invoke('registerViolation', { type, message })
  },

  // Get current app state
  getViolationStatus: () => {
    return ipcRenderer.invoke('getViolationStatus')
  },

  // Remove violation listener
  offViolation: () => {
    ipcRenderer.removeAllListeners('VIOLATION_DETECTED')
  },

  // Legacy support for old API
  examSecurity: {
    onViolation: (callback) => {
      ipcRenderer.on('VIOLATION_DETECTED', (event, data) => {
        callback(data.type)
      })
    }
  }
})

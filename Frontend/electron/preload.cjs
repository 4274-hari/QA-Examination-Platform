// CommonJS preload to avoid ESM import issues in sandbox
const { contextBridge } = require('electron')

try {
  contextBridge.exposeInMainWorld('appEnv', {
    isElectron: true
  })
} catch (e) {
  // no-op
}

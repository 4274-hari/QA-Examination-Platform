import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready
    icon: path.join(__dirname, "../src/assets/icons/icon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // Use CJS preload to avoid ESM import error in sandbox
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: false // Allow loading local files in production
    }
  })

  // Show window when ready to prevent white flash
  win.once('ready-to-show', () => {
    win.show()
  })

  // Log any errors
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })

  if (isDev) {
    // Load Vite dev server at QA exam route
    await win.loadURL('http://localhost:5173/QA/qaexam')
    // win.webContents.openDevTools({ mode: 'detach' })
  } else {
    // In production, load the built file directly via file://
    const distPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked', 'dist')
      : path.join(__dirname, '..', 'dist')

    const indexPath = path.join(distPath, 'index.html')
    console.log('Loading file://', indexPath)
    
    // Load with hash route for QA exam
    await win.loadFile(indexPath, { hash: '/QA/qaexam' })

    // Open DevTools temporarily to debug
    // win.webContents.openDevTools({ mode: 'detach' })
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

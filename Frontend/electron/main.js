import { app, BrowserWindow, clipboard, ipcMain, globalShortcut } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* -------------------------------------------------- */
/* Path helpers */
/* -------------------------------------------------- */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = !app.isPackaged

/* -------------------------------------------------- */
/* 🔐 SINGLE INSTANCE LOCK (CRITICAL) */
/* -------------------------------------------------- */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

/* -------------------------------------------------- */
/* Create Secure Exam Window */
/* -------------------------------------------------- */
async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    kiosk: true,                 // blocks Alt+F4, Win key (partially)
    alwaysOnTop: true,
    show: false,
    icon: path.join(__dirname, '../src/assets/icons/icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,         // 🚨 MUST be true
      preload: path.join(__dirname, 'preload.cjs'),
    }
  })

  /* -------------------------------------------------- */
  /* Show only when fully ready */
  /* -------------------------------------------------- */
  win.once('ready-to-show', () => win.show())

  /* -------------------------------------------------- */
  /* 🚫 HARD BLOCK DEVTOOLS (UNBYPASSABLE) */
  /* -------------------------------------------------- */
  win.webContents.on('devtools-opened', () => {
    win.webContents.closeDevTools()
    app.quit() // immediate termination = tampering detected
  })

  win.webContents.on('before-input-event', (event, input) => {
    if (
      input.key === 'F12' ||
      (input.control && input.shift && ['I', 'J', 'C'].includes(input.key))
    ) {
      event.preventDefault()
    }
  })

  /* -------------------------------------------------- */
  /* 🔒 FULLSCREEN ENFORCEMENT */
  /* -------------------------------------------------- */
  let isFullscreenExitHandling = false
  win.on('leave-full-screen', () => {
    if (!isFullscreenExitHandling) {
      isFullscreenExitHandling = true
      win.webContents.send('VIOLATION_DETECTED', { type: 'fullscreenExit', message: 'Exited fullscreen mode' })
      
      // Re-enter fullscreen after short delay
      setTimeout(() => {
        win.setFullScreen(true)
        isFullscreenExitHandling = false
      }, 200)
    }
  })

  /* -------------------------------------------------- */
  /* 🔁 ALT+TAB / WIN SWITCH DETECTION (Blur Event) */
  /* -------------------------------------------------- */
  win.on('blur', () => {
    win.webContents.send('VIOLATION_DETECTED', { type: 'windowBlur', message: 'Window lost focus - possible Alt+Tab or window switch' })
  })

  /* -------------------------------------------------- */
  /* 🎯 FOCUS REGAIN TRACKING */
  /* -------------------------------------------------- */
  win.on('focus', () => {
    win.webContents.send('FOCUS_REGAINED')
  })

  /* -------------------------------------------------- */
  /* 🚫 BLOCK NAVIGATION & POPUPS */
  /* -------------------------------------------------- */
  win.webContents.on('will-navigate', (e) => e.preventDefault())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  /* -------------------------------------------------- */
  /* 📋 CLIPBOARD WIPE (OS LEVEL) */
  /* -------------------------------------------------- */
  setInterval(() => {
    clipboard.clear()
  }, 400)

  /* -------------------------------------------------- */
  /* ⌨️ GLOBAL KEYBOARD SHORTCUTS - Block exam exit shortcuts */
  /* -------------------------------------------------- */
  globalShortcut.registerAll(['Escape', 'Alt+F4', 'Ctrl+Q', 'Super+D', 'Super+X'], (accelerator) => {
    // Silent block - do nothing to prevent accidental triggering
    return true
  })

  /* -------------------------------------------------- */
  /* 🔐 IPC HANDLERS FOR VIOLATION REGISTRATION */
  /* -------------------------------------------------- */
  ipcMain.handle('registerViolation', async (event, { type, message }) => {
    // Send violation to renderer for backend registration
    win.webContents.send('PROCESS_VIOLATION', { type, message })
    return { success: true }
  })

  ipcMain.handle('getViolationStatus', async () => {
    // Returns current app state (fullscreen status, focus status, etc.)
    return {
      isFullscreen: win.isFullScreen(),
      isFocused: win.isFocused(),
      isVisible: win.isVisible()
    }
  })

  /* -------------------------------------------------- */
  /* Load App */
  /* -------------------------------------------------- */
  if (isDev) {
    await win.loadURL('http://localhost:5173/QA/qaexam')
  } else {
    const distPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist')
    const indexPath = path.join(distPath, 'index.html')
    await win.loadFile(indexPath, { hash: '/QA/qaexam' })
  }
}

/* -------------------------------------------------- */
/* App lifecycle */
/* -------------------------------------------------- */
app.whenReady().then(createWindow)

app.on('second-instance', () => {
  // prevent second launch
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

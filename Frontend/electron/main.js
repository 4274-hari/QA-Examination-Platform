import { app, BrowserWindow, clipboard, ipcMain, globalShortcut, session } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'

// Simple MIME type mapper (built-in, no dependencies)
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

/* -------------------------------------------------- */
/* Path helpers */
/* -------------------------------------------------- */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = !app.isPackaged

/* -------------------------------------------------- */
/* Load Environment Variables */
/* -------------------------------------------------- */
if (!isDev) {
  const envPath = path.join(process.resourcesPath, 'app.asar.unpacked', '.env.production')
  dotenv.config({ path: envPath })
  console.log('[Electron] Loaded production environment variables from:', envPath)
} else {
  const envPath = path.join(__dirname, '..', '.env.production')
  dotenv.config({ path: envPath })
  console.log('[Electron] Loaded development environment variables from:', envPath)
}

// ✅ Get backend URL from environment or use default
const BACKEND_URL = process.env.VITE_API_URL || 'http://localhost:5000'
console.log('[Electron] Backend URL:', BACKEND_URL)

/* -------------------------------------------------- */
/* 🔐 SINGLE INSTANCE LOCK (CRITICAL) */
/* -------------------------------------------------- */
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

// Only treat as insecure for HTTP (development)
if (BACKEND_URL.startsWith('http://')) {
  app.commandLine.appendSwitch('unsafely-treat-insecure-origin-as-secure', BACKEND_URL)
}
app.commandLine.appendSwitch('disable-features', 'BlockInsecurePrivateNetworkRequests')

/* -------------------------------------------------- */
/* 🔧 SIMPLE HTTP SERVER FOR PRODUCTION */
/* -------------------------------------------------- */
let staticServer = null

function createStaticServer() {
  if (isDev) return null

  const distPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'dist')
  
  const server = http.createServer((req, res) => {
    console.log('[Static Server] Request:', req.method, req.url)
    
    // Get requested path
    let filePath = req.url === '/' ? '/index.html' : req.url
    
    // Remove query string and hash
    filePath = filePath.split('?')[0].split('#')[0]
    
    // Build full file path
    const fullPath = path.join(distPath, filePath)
    
    console.log('[Static Server] Serving:', fullPath)
    
    // Check if file exists
    if (existsSync(fullPath) && fullPath.includes('.')) {
      // Serve the file
      try {
        const content = readFileSync(fullPath)
        const mimeType = getMimeType(fullPath)
        
        res.writeHead(200, { 'Content-Type': mimeType })
        res.end(content)
      } catch (err) {
        console.error('Error reading file:', err)
        res.writeHead(500)
        res.end('Internal Server Error')
      }
    } else {
      // ✅ CRITICAL FIX: For SPA routing - ALWAYS serve index.html for non-file requests
      // This includes routes like /QA/qaexam
      try {
        const indexPath = path.join(distPath, 'index.html')
        const content = readFileSync(indexPath)
        
        console.log('[Static Server] SPA Route - Serving index.html for:', req.url)
        
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(content)
      } catch (err) {
        console.error('Error reading index.html:', err)
        res.writeHead(404)
        res.end('Not Found')
      }
    }
  })
  
  // Listen on random available port
  server.listen(0, '127.0.0.1')
  
  return server
}

/* -------------------------------------------------- */
/* Create Secure Exam Window */
/* -------------------------------------------------- */
async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    kiosk: !isDev,                 // blocks Alt+F4, Win key (partially)
    alwaysOnTop: !isDev,
    show: false,
    icon: path.join(__dirname, '../src/assets/icons/icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    }
  })
  
  /* -------------------------------------------------- */
  /* 🍪 CONFIGURE SESSION FOR COOKIES WITH MANUAL HANDLING */
  /* -------------------------------------------------- */
  const ses = session.defaultSession
  
  // ✅ Enable persistent cookies
  await ses.cookies.flushStore()
  
  // ✅ Intercept responses to ensure cookies are stored
  ses.webRequest.onHeadersReceived({ urls: [`${BACKEND_URL}/*`] }, (details, callback) => {
    const setCookieHeaders = details.responseHeaders['set-cookie'] || details.responseHeaders['Set-Cookie']
    
    if (setCookieHeaders) {
      console.log('[Electron] Set-Cookie detected:', setCookieHeaders)
      
      // Parse and store each cookie
      setCookieHeaders.forEach(async (cookieStr) => {
        try {
          // Parse cookie string
          const cookieParts = cookieStr.split(';')[0].split('=')
          const name = cookieParts[0].trim()
          const value = cookieParts.slice(1).join('=').trim()
          
          // Store cookie in Electron's cookie store
          await ses.cookies.set({
            url: BACKEND_URL,
            name: name,
            value: value,
            httpOnly: true,
            sameSite: 'lax'
          })
          
          console.log('[Electron] Cookie stored:', name, 'for', BACKEND_URL)
        } catch (err) {
          console.error('[Electron] Failed to store cookie:', err)
        }
      })
    }
    
    callback({ responseHeaders: details.responseHeaders })
  })
  
  // ✅ Intercept requests to attach cookies
  ses.webRequest.onBeforeSendHeaders({ urls: [`${BACKEND_URL}/*`] }, async (details, callback) => {
    const cookies = await ses.cookies.get({ url: BACKEND_URL })
    
    if (cookies.length > 0) {
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')
      console.log('[Electron] Attaching cookies to:', details.url)
      
      details.requestHeaders['Cookie'] = cookieHeader
    }
    
    callback({ requestHeaders: details.requestHeaders })
  })
  
  console.log('[Electron] Cookie storage configured with manual handling for:', BACKEND_URL)
  
  console.log('[Electron] Cookie storage configured with manual handling')
  
  /* -------------------------------------------------- */
  /* Open dev tool for testing */
  /* -------------------------------------------------- */
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' })
  }

  /* -------------------------------------------------- */
  /* 🚫 HARD BLOCK DEVTOOLS (UNBYPASSABLE) */
  /* -------------------------------------------------- */
  // if (!isDev) {
  //   win.webContents.on('devtools-opened', () => {
  //     win.webContents.closeDevTools()
  //     app.quit() // tampering detected in production only
  //   })
  // }
  
  /* -------------------------------------------------- */
  /* Show only when fully ready */
  /* -------------------------------------------------- */
  win.once('ready-to-show', () => win.show())

  /* -------------------------------------------------- */
  /* 🚫 HARD BLOCK DEVTOOLS (UNBYPASSABLE) */
  /* -------------------------------------------------- */
  win.webContents.on('before-input-event', (event, input) => {
    if (!isDev) {
      if (
        input.key === 'F12' ||
        (input.control && input.shift && ['I', 'J', 'C'].includes(input.key))
      ) {
        event.preventDefault()
      }
    }
  })

  /* -------------------------------------------------- */
  /* 🔒 FULLSCREEN ENFORCEMENT */
  /* -------------------------------------------------- */
  let isFullscreenExitHandling = false
  win.on('leave-full-screen', () => {
    if (!isFullscreenExitHandling) {
      isFullscreenExitHandling = true
      win.webContents.send('VIOLATION_DETECTED', { 
        type: 'fullscreenExit', 
        message: 'Exited fullscreen mode' 
      })
      
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
    win.webContents.send('VIOLATION_DETECTED', { 
      type: 'windowBlur', 
      message: 'Window lost focus - possible Alt+Tab or window switch' 
    })
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
  /* ⌨️ GLOBAL KEYBOARD SHORTCUTS */
  /* -------------------------------------------------- */
  globalShortcut.registerAll([
    'Escape', 'Alt+F4', 'Ctrl+Q', 'Super+D', 'Super+X'
  ], () => true)

  /* -------------------------------------------------- */
  /* 📋 CLIPBOARD WIPE (OS LEVEL) */
  /* -------------------------------------------------- */
  setInterval(() => {
    clipboard.clear()
  }, 400)

  /* -------------------------------------------------- */
  /* 🔐 IPC HANDLERS FOR VIOLATION REGISTRATION */
  /* -------------------------------------------------- */
  ipcMain.handle('registerViolation', async (event, { type, message }) => {
    win.webContents.send('PROCESS_VIOLATION', { type, message })
    return { success: true }
  })

  ipcMain.handle('getViolationStatus', async () => {
    return {
      isFullscreen: win.isFullScreen(),
      isFocused: win.isFocused(),
      isVisible: win.isVisible()
    }
  })

  /* -------------------------------------------------- */
  /* ✅ LOAD APP  */
  /* -------------------------------------------------- */
  if (isDev) {
    await win.loadURL('http://localhost:5173/')
    
    // ✅ Wait for React to be ready, then navigate
    win.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        win.webContents.executeJavaScript(`
          if (window.location.pathname !== '/QA/qaexam') {
            window.location.href = '/QA/qaexam';
          }
        `)
      }, 500)
    })
  } else {
    // Production: Start local HTTP server and load from it
    staticServer = createStaticServer()
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const port = staticServer.address().port
    const serverUrl = `http://127.0.0.1:${port}`
    
    console.log('[Electron] Static server running at:', serverUrl)
    
    // ✅ Load root first
    await win.loadURL(serverUrl)
    
    // ✅ Wait for React to be ready, then navigate to /QA/qaexam
    win.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        win.webContents.executeJavaScript(`
          console.log('[Electron] Current path:', window.location.pathname);
          if (window.location.pathname !== '/QA/qaexam') {
            console.log('[Electron] Navigating to /QA/qaexam');
            window.location.href = '/QA/qaexam';
          }
        `)
      }, 500) // Give React Router time to initialize
    })
    win.webContents.openDevTools({ mode: 'detach' })
  }
}

/* -------------------------------------------------- */
/* App lifecycle */
/* -------------------------------------------------- */
app.whenReady().then(() => {
  createWindow()
})

app.on('second-instance', () => {
  // prevent second launch
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (staticServer) {
      staticServer.close()
    }
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  if (staticServer) {
    staticServer.close()
  }
})
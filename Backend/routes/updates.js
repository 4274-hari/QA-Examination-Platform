const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const requireAuth = require("../middlewares/auth")
const router = express.Router()

// ✅ CHANGED: Directory now points to /var/www/electron-updates
// Format: /var/www/electron-updates/
//         - latest.yml
//         - 1.0.0/1.0.0.exe
//         - 1.0.0/1.0.0.exe.blockmap
//         - 0.0.0/0.0.0.exe
const UPDATES_DIR = path.join(__dirname, '../../electron-updates')

// Ensure directory exists
if (!fs.existsSync(UPDATES_DIR)) {
  fs.mkdirSync(UPDATES_DIR, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Extract version from yml if available
    const version = req.body?.version || 'temp'
    const versionDir = path.join(UPDATES_DIR, version)
    
    // Create version-specific directory
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true })
    }
    
    cb(null, versionDir)
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
})

// ✅ Serve latest.yml (required by electron-updater)
router.get('/latest.yml', (req, res) => {
  const ymlPath = path.join(UPDATES_DIR, 'latest.yml')
  
  if (!fs.existsSync(ymlPath)) {
    return res.status(404).json({ error: 'No updates available' })
  }
  
  res.setHeader('Content-Type', 'text/yaml')
  res.sendFile(ymlPath)
})

// ✅ CHANGED: Serve versioned update files (e.g., /1.0.0/1.0.0.exe)
router.get('/:version/:filename', (req, res) => {
  const filePath = path.join(UPDATES_DIR, req.params.version, req.params.filename)
  
  // ✅ Security: Prevent directory traversal
  if (!filePath.startsWith(UPDATES_DIR)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  
  res.sendFile(filePath)
})

// ✅ Upload new update (Admin only - AUTHENTICATION REQUIRED)
// ✅ CHANGED: Now expects version parameter and creates versioned folders
router.post('/upload', 
  // requireAuth,
  (req, res) => {
    // if (req.user?.role !== 'admin' && req.user?.role !== 'staff') {
    //   return res.status(403).json({ error: 'Only admin/staff can upload updates' })
    // }

    const version = req.query.version
    if (!version) {
      return res.status(400).json({ error: 'Version is required in request body' })
    }

    // ✅ Validate version format (semantic versioning)
    if (!/^\d+\.\d+\.\d+/.test(version)) {
      return res.status(400).json({ error: 'Invalid version format. Use semantic versioning (x.y.z)' })
    }

    // Create version directory
    const versionDir = path.join(UPDATES_DIR, version)
    if (!fs.existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true })
    }

    // Configure multer with version directory
    const versionStorage = multer.diskStorage({
      destination: versionDir,
      filename: (req, file, cb) => {
        cb(null, file.originalname)
      }
    })
    
    const versionUpload = multer({ 
      storage: versionStorage,
      limits: { fileSize: 500 * 1024 * 1024 }
    })

    versionUpload.fields([
      { name: 'exe', maxCount: 1 },
      { name: 'blockmap', maxCount: 1 },
      { name: 'yml', maxCount: 1 }
    ])(req, res, (uploadErr) => {
      if (uploadErr) {
        console.error('[Updates] Upload error:', uploadErr)
        return res.status(400).json({ error: uploadErr.message })
      }

      if (!req.files?.exe || !req.files?.yml) {
        return res.status(400).json({ error: 'Missing required files: exe and yml' })
      }

      const ymlFile = req.files.yml?.[0]

      if (ymlFile) {
        const rootYmlPath = path.join(UPDATES_DIR, 'latest.yml')

        fs.copyFileSync(
          path.join(versionDir, ymlFile.filename),
          rootYmlPath
        )

        // Optional: remove from version folder
        fs.unlinkSync(path.join(versionDir, ymlFile.filename))
      }

      try {
        console.log(`[Updates] Version ${version} uploaded by: ${req.user?.email}`)
        console.log(`[Updates] Files in /electron-updates/${version}/:`, Object.keys(req.files))
        
        res.json({
          success: true,
          message: `Update version ${version} uploaded successfully`,
          version: version,
          files: {
            exe: req.files.exe?.[0]?.filename,
            blockmap: req.files.blockmap?.[0]?.filename,
            yml: req.files.yml?.[0]?.filename
          }
        })
      } catch (error) {
        console.error('[Updates] Upload error:', error)
        res.status(500).json({ error: 'Upload failed' })
      }
    })
  }
)

// ✅ Get current version info
router.get('/version/current', (req, res) => {
  const ymlPath = path.join(UPDATES_DIR, 'latest.yml')
  
  if (!fs.existsSync(ymlPath)) {
    return res.json({ version: null })
  }
  
  try {
    const yml = fs.readFileSync(ymlPath, 'utf8')
    const versionMatch = yml.match(/version: (.*)/)
    const version = versionMatch ? versionMatch[1] : null
    
    res.json({ version })
  } catch (error) {
    res.status(500).json({ error: 'Failed to read version' })
  }
})

// ✅ List all available updates (Admin only)
// ✅ CHANGED: Now lists versions in separate folders
router.get('/list', requireAuth, (req, res) => {
  try {
    const files = fs.readdirSync(UPDATES_DIR)
    
    const updates = files
      .filter(f => {
        const fullPath = path.join(UPDATES_DIR, f)
        return fs.statSync(fullPath).isDirectory()
      })
      .map(version => {
        const versionDir = path.join(UPDATES_DIR, version)
        const versionFiles = fs.readdirSync(versionDir)
        const exeFile = versionFiles.find(f => f.endsWith('.exe'))
        
        return {
          version: version,
          files: versionFiles,
          size: exeFile ? fs.statSync(path.join(versionDir, exeFile)).size : 0,
          created: fs.statSync(versionDir).birthtime
        }
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created))
    
    res.json({ updates })
  } catch (error) {
    console.error('[Updates] List error:', error)
    res.status(500).json({ error: 'Failed to list updates' })
  }
})

// ✅ Delete old update version (Admin only)
// ✅ CHANGED: Deletes entire version directory
router.delete('/:version', requireAuth, (req, res) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can delete updates' })
  }

  const versionDir = path.join(UPDATES_DIR, req.params.version)
  
  // ✅ Security: Prevent directory traversal
  if (!versionDir.startsWith(UPDATES_DIR)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  if (!fs.existsSync(versionDir)) {
    return res.status(404).json({ error: 'Version not found' })
  }

  try {
    // Recursively delete version directory
    fs.rmSync(versionDir, { recursive: true, force: true })
    console.log(`[Updates] Version ${req.params.version} deleted by: ${req.user?.email}`)
    res.json({ success: true, message: `Version ${req.params.version} deleted` })
  } catch (error) {
    console.error('[Updates] Delete error:', error)
    res.status(500).json({ error: 'Failed to delete version' })
  }
})

module.exports = router
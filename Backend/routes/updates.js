const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const requireAuth = require("../middlewares/auth")
const router = express.Router()

// Directory for storing updates
const UPDATES_DIR = path.join(__dirname, '../public/electron-updates')

// Ensure directory exists
if (!fs.existsSync(UPDATES_DIR)) {
  fs.mkdirSync(UPDATES_DIR, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: UPDATES_DIR,
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

// ✅ Serve update files (.exe, .blockmap)
router.get('/:filename', (req, res) => {
  const filePath = path.join(UPDATES_DIR, req.params.filename)
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  
  res.sendFile(filePath)
})

// ✅ Upload new update (Admin only - ADD AUTHENTICATION!)
router.post('/upload', 
  upload.fields([
    { name: 'exe', maxCount: 1 },
    { name: 'blockmap', maxCount: 1 },
    { name: 'yml', maxCount: 1 }
  ]),
  (req, res) => {
    try {
      console.log('[Updates] Files uploaded:', Object.keys(req.files))
      
      res.json({
        success: true,
        message: 'Update files uploaded successfully',
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

// ✅ List all available updates
router.get('/list', requireAuth, (req, res) => {
  const files = fs.readdirSync(UPDATES_DIR)
  
  const updates = files.filter(f => f.endsWith('.exe')).map(file => {
    const stats = fs.statSync(path.join(UPDATES_DIR, file))
    return {
      filename: file,
      size: stats.size,
      created: stats.birthtime
    }
  })
  
  res.json({ updates })
})

// ✅ Delete old update
router.delete('/:filename', requireAuth, (req, res) => {
  const filePath = path.join(UPDATES_DIR, req.params.filename)
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' })
  }
  
  try {
    fs.unlinkSync(filePath)
    res.json({ success: true, message: 'File deleted' })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

module.exports = router
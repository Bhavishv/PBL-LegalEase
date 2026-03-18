const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Set up storage engine for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // We name the file directly after the session ID
    // req.body.sessionId comes from the client
    const sessionId = req.body.sessionId;
    if (!sessionId) {
      return cb(new Error('Missing sessionId'));
    }
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${sessionId}${ext}`);
  }
});

const upload = multer({ storage: storage });

// Store active sessions in memory
// In production, use Redis or a DB
const activeSessions = new Map();

// @route   POST /api/scan/session
// @desc    Generate a new scan session ID
// @access  Public (or protected if user is logged in)
router.post('/session', (req, res) => {
  const sessionId = uuidv4();
  activeSessions.set(sessionId, {
    status: 'pending',
    createdAt: Date.now(),
    filePath: null,
    fileName: null
  });
  res.json({ sessionId });
});

// @route   POST /api/scan/upload
// @desc    Upload an image for a specific session ID
// @access  Public (mobile phone uploads here)
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId || !req.file) {
      return res.status(400).json({ message: 'Missing sessionId or image file.' });
    }

    if (!activeSessions.has(sessionId)) {
      // Create session if it doesn't exist just in case it expired, 
      // but in a strict system we might reject it.
      activeSessions.set(sessionId, { status: 'pending', createdAt: Date.now() });
    }

    // Update the session state
    const sessionData = activeSessions.get(sessionId);
    sessionData.status = 'completed';
    sessionData.filePath = req.file.path;
    sessionData.fileName = req.file.filename;

    activeSessions.set(sessionId, sessionData);

    res.json({ message: 'Image uploaded successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/scan/status/:sessionId
// @desc    Check the status of a scan session (Polling endpoint for PC)
// @access  Public 
router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionData = activeSessions.get(sessionId);

  if (!sessionData) {
    return res.status(404).json({ message: 'Session not found or expired.' });
  }

  if (sessionData.status === 'completed') {
    // Optional: send the file directly or just send status to let client fetch it.
    // Here we'll just send the status and the relative path so the client can fetch the image.
    res.json({
      status: 'completed',
      imageUrl: `/api/scan/image/${sessionData.fileName}`
    });
  } else {
    res.json({ status: 'pending' });
  }
});

// @route   GET /api/scan/image/:fileName
// @desc    Serve the uploaded image to the frontend
// @access  Public 
router.get('/image/:fileName', (req, res) => {
  const { fileName } = req.params;
  const filePath = path.join(__dirname, '../uploads', fileName);

  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
    // After sending, we can optionally delete the file to save space (fire and forget)
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Error deleting file ${filePath}:`, err);
        else console.log(`Deleted temp file ${filePath}`);
      });
      // also cleanup memory session
      const baseName = path.parse(fileName).name;
      activeSessions.delete(baseName);
    }, 5000); // Wait 5 seconds to ensure frontend fully received it before deleting
  } else {
    res.status(404).json({ message: 'Image not found.' });
  }
});

module.exports = router;

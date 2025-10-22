const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.CLIENT_URL || "http://localhost:3000",
      "https://suralyric.netlify.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "https://suralyric.netlify.app"
  ],
  credentials: true
}));
app.use(express.json());

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory user storage (in production, use a database)
const users = [
  {
    id: 1,
    username: 'itweera',
    password: '$2b$10$WkKJGB9UccO3zO6oGZRM3.I4GfFGb3za96Dmlr3JgB1aaPv4K9ooq', // itweera321
    role: 'master',
    displayName: 'Band Leader'
  }
];

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Store connected clients and their roles
const clients = new Map();
let currentFile = null;
let connectedDevices = 0;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  connectedDevices++;
  
  // Update device count for all clients
  io.emit('deviceCountUpdate', connectedDevices);

  socket.on('joinSession', (data) => {
    const { role, sessionId, user } = data;
    clients.set(socket.id, { role, sessionId, socket, user });
    
    console.log(`Client ${socket.id} (${user?.displayName || user?.username}) joined as ${role} in session ${sessionId}`);
    
    // Notify all clients about the new connection
    socket.broadcast.emit('userJoined', {
      role,
      sessionId,
      user,
      deviceCount: connectedDevices
    });
    
    // Send current file to new viewer if it exists
    if (role === 'viewer' && currentFile && currentFile.fileName) {
      socket.emit('fileSync', currentFile);
    }
  });

  socket.on('fileUpload', (data) => {
    const client = clients.get(socket.id);
    if (client && client.role === 'master') {
      currentFile = data;
      console.log('Master uploaded file:', data.fileName);
      
      // Broadcast file to all viewers
      socket.broadcast.emit('fileSync', data);
      
      // Notify all clients about the file upload
      io.emit('fileUploaded', {
        fileName: data.fileName,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('fullscreenToggle', (data) => {
    const client = clients.get(socket.id);
    if (client && client.role === 'master') {
      console.log('Master toggled fullscreen:', data.isFullscreen);
      
      // Broadcast fullscreen state to all viewers
      socket.broadcast.emit('fullscreenToggle', data);
    }
  });


  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const client = clients.get(socket.id);
    connectedDevices--;
    clients.delete(socket.id);
    
    // Notify other clients about the disconnection
    if (client) {
      socket.broadcast.emit('userLeft', {
        role: client.role,
        user: client.user,
        deviceCount: connectedDevices
      });
    }
    
    // Update device count for remaining clients
    io.emit('deviceCountUpdate', connectedDevices);
  });
});

// Helper function to extract text from files
async function extractTextFromFile(filePath, mimeType) {
  try {
    console.log(`Starting text extraction for ${mimeType} file: ${filePath}`);
    
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      const extractedText = data.text.trim();
      console.log(`PDF text extraction completed. Text length: ${extractedText.length}`);
      return extractedText;
    } else if (mimeType.startsWith('image/')) {
      console.log('Starting OCR processing for image...');
      const worker = await createWorker('sin+eng'); // Support Sinhala and English
      
      // Configure for better text recognition
      await worker.setParameters({
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text
        tessedit_ocr_engine_mode: '2' // Use LSTM OCR engine
      });
      
      // Add timeout for OCR processing (5 minutes max)
      const ocrPromise = worker.recognize(filePath);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OCR processing timeout')), 300000) // 5 minutes
      );
      
      const { data: { text } } = await Promise.race([ocrPromise, timeoutPromise]);
      await worker.terminate();
      const extractedText = text.trim();
      console.log(`OCR processing completed. Text length: ${extractedText.length}`);
      return extractedText;
    }
    return null;
  } catch (error) {
    console.error('Text extraction error:', error);
    // Return a fallback message instead of null
    return `Text extraction failed: ${error.message}`;
  }
}

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        displayName: user.displayName
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user data (without password) and token
    const userData = {
      id: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  // In a real application, you might want to blacklist the token
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// File upload endpoint
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`File upload started: ${req.file.originalname} (${req.file.mimetype})`);
    
    // Extract text from the file
    const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);

    const fileData = {
      fileName: req.file.originalname,
      storedFileName: req.file.filename, // The actual stored filename
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText: extractedText,
      timestamp: new Date().toISOString()
    };

    // Store the file data
    currentFile = fileData;

    // Broadcast to all connected clients
    io.emit('fileSync', fileData);
    io.emit('fileUploaded', {
      fileName: fileData.fileName,
      timestamp: fileData.timestamp
    });

    console.log(`File upload completed successfully: ${fileData.fileName}`);
    res.json({ 
      success: true, 
      message: 'File uploaded and broadcasted successfully',
      file: fileData
    });
  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'File upload failed', 
      message: error.message 
    });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    connectedDevices,
    currentFile: currentFile ? currentFile.fileName : null
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
});

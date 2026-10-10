require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize database
const db = require('./database/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Directories
const frontendDir = path.join(__dirname, '..', 'frontend');
const rootDir = path.join(__dirname, '..');

// Sync NEC logo
const srcLogo = path.join(rootDir, 'assets', 'nec-logo.png');
const destLogoDir = path.join(frontendDir, 'assets');
const destLogo = path.join(destLogoDir, 'nec-logo.png');

try {
  if (fs.existsSync(srcLogo) && !fs.existsSync(destLogo)) {
    if (!fs.existsSync(destLogoDir)) {
      fs.mkdirSync(destLogoDir, { recursive: true });
    }
    fs.copyFileSync(srcLogo, destLogo);
  }

  // Keep frontend mirrors in sync
  const rootAppJs = path.join(rootDir, 'js', 'app.js');
  const frontAppJs = path.join(frontendDir, 'js', 'app.js');
  if (fs.existsSync(rootAppJs)) {
    fs.copyFileSync(rootAppJs, frontAppJs);
  }
  const rootPortal = path.join(rootDir, 'portal.html');
  const frontPortal = path.join(frontendDir, 'portal.html');
  if (fs.existsSync(rootPortal)) {
    fs.copyFileSync(rootPortal, frontPortal);
  }
} catch (e) {
  console.warn('Note: Could not sync assets or frontend mirrors:', e.message);
}

// Serve frontend static assets (prioritize root, fallback to frontend)
app.use(express.static(rootDir));
app.use(express.static(frontendDir));

// Frontend HTML routes (serve from root, fallback to frontend)
app.get('/', (req, res) => {
  const file = path.join(rootDir, 'index.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.get('/login', (req, res) => {
  const file = path.join(rootDir, 'login.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.sendFile(path.join(frontendDir, 'login.html'));
});

app.get('/portal', (req, res) => {
  const file = path.join(rootDir, 'portal.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.sendFile(path.join(frontendDir, 'portal.html'));
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'NEC Sports Portal Backend & Automated OD Engine',
    version: '1.0.0',
    stats: {
      events: db.get('events').length,
      participants: db.get('participants').length,
      odBatches: db.get('odBatches').length,
      users: db.get('users').length
    }
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/participants', require('./routes/participantRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/od', require('./routes/odRoutes'));
app.use('/api/points', require('./routes/pointsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// 404 Handler for API
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' was not found.`
  });
});

// Global error handler
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Optional non-blocking MongoDB connection (if mongoose is installed and MONGO_URI is set)
if (process.env.MONGO_URI) {
  try {
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI)
      .then(() => console.log('✅ MongoDB connection established'))
      .catch(err => console.warn('ℹ️ MongoDB notice (running on robust local database):', err.message));
  } catch {
    // Mongoose not installed; smoothly running with local JSON database
  }
}

// Start HTTP Server
app.listen(PORT, () => {
  console.log('================================================================');
  console.log('🏆 NEC Sports Event Management & Automated OD Portal');
  console.log('🏛️ National Engineering College (Autonomous), Kovilpatti');
  console.log('----------------------------------------------------------------');
  console.log(`🚀 Server successfully running on: http://localhost:${PORT}`);
  console.log(`📊 Registered Events:       ${db.get('events').length}`);
  console.log(`👥 Registered Participants: ${db.get('participants').length}`);
  console.log(`⚡ OD Batches Generated:    ${db.get('odBatches').length}`);
  console.log(`🔐 Active Users:            ${db.get('users').length}`);
  console.log('================================================================');
});

module.exports = app;
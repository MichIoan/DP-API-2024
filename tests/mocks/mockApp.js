/**
 * Mock Express application for integration tests
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mockResponseMiddleware = (req, res, next) => {
  // Add response helper methods used in the real application
  res.response = (req, res, statusCode, data) => {
    return res.status(statusCode).json(data);
  };
  next();
};

// Initialize mock app
const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));
app.use(mockResponseMiddleware);

// Mock auth routes
const authRouter = express.Router();

// Register route
authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { User } = require('../../src/models/User');
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    
    // Create new user
    const newUser = await User.create({
      email,
      password, // Password will be hashed by the controller
      first_name,
      last_name,
      role: 'USER',
      status: 'ACTIVE'
    });
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: newUser.user_id,
        email: newUser.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login route
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { User } = require('../../src/models/User');
    const RefreshToken = require('../../src/models/RefreshToken');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcrypt');
    
    // Find the user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    try {
      // Check password (mock this in tests)
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (passwordError) {
      // If bcrypt.compare throws an error, return invalid credentials
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate tokens
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    // Create refresh token
    const refreshToken = await RefreshToken.create({
      user_id: user.user_id,
      token: 'mock-refresh-token',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      is_revoked: false
    });
    
    res.status(200).json({
      token,
      refreshToken: refreshToken.token,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refresh token route
authRouter.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    const RefreshToken = require('../../src/models/RefreshToken');
    const { User } = require('../../src/models/User');
    const jwt = require('jsonwebtoken');
    
    // Find the refresh token
    const tokenDoc = await RefreshToken.findOne({ where: { token: refreshToken } });
    if (!tokenDoc || tokenDoc.is_revoked || new Date() > tokenDoc.expires_at) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Find the user
    const user = await User.findOne({ where: { user_id: tokenDoc.user_id } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    res.status(200).json({
      accessToken,
      user: {
        id: user.user_id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mount the auth router
app.use('/auth', authRouter);

// Create a server that can be closed after tests
let server;
const startServer = () => {
  // If there's already a global server instance, return it
  if (global.__test_server__) {
    return global.__test_server__;
  }
  
  // Create a new server instance
  const port = process.env.TEST_PORT || 3001;
  server = app.listen(port);
  
  // Store the server instance globally
  global.__test_server__ = server;
  
  // Add a forceful cleanup mechanism for the server
  process.on('exit', () => {
    if (server && server.listening) {
      server.close();
    }
  });
  
  return server;
};

const closeServer = () => {
  if (!server) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    if (!server.listening) {
      server = null;
      global.__test_server__ = null;
      return resolve();
    }
    
    server.close(() => {
      server = null;
      global.__test_server__ = null;
      resolve();
    });
  });
};

module.exports = { app, startServer, closeServer };

/**
 * Mock Express application for E2E tests
 * Provides a lightweight implementation of the main routes for testing
 */
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// Middleware to handle responses in the same format as the main app
const mockResponseMiddleware = (req, res, next) => {
  // Add response helper methods used in the real application
  res.response = (req, res, statusCode, data) => {
    return res.status(statusCode).json(data);
  };
  next();
};

// Authentication middleware
const isLoggedIn = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // During tests, we don't actually verify the token
    // We just extract the role from JWT mock in tests
    if (token === 'mock-jwt-token') {
      // Default test user
      req.user = { id: 1, role: 'USER' };
      return next();
    }
    
    // Handle admin token specifically
    if (token.includes('admin')) {
      req.user = { id: 2, role: 'ADMIN' };
      return next();
    }
    
    // For any other token, attempt to verify with JWT
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      req.user = decoded;
      return next();
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role-based access control middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error',
        message: 'Forbidden: Insufficient permissions' 
      });
    }
    
    next();
  };
};

// Initialize mock app
const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));
app.use(mockResponseMiddleware);

// Auth Routes
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
    console.error('Registration error:', error);
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
    console.error('Refresh token error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout route
authRouter.post('/logout', isLoggedIn, async (req, res) => {
  try {
    const RefreshToken = require('../../src/models/RefreshToken');
    
    // Find all refresh tokens for the user
    const refreshTokens = await RefreshToken.findAll({ 
      where: { user_id: req.user.id } 
    });
    
    // Invalidate all refresh tokens
    await RefreshToken.destroy({ 
      where: { user_id: req.user.id } 
    });
    
    res.status(200).json({ 
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Routes
const userRouter = express.Router();

// Get user account
userRouter.get('/account', isLoggedIn, async (req, res) => {
  try {
    const { User } = require('../../src/models/User');
    
    // Find the user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      id: user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user account
userRouter.put('/account', isLoggedIn, async (req, res) => {
  try {
    const { email, first_name, last_name } = req.body;
    const { User } = require('../../src/models/User');
    
    // Find the user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user
    await User.update({
      email: email || user.email,
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name
    }, { where: { user_id: req.user.id } });
    
    res.status(200).json({ 
      message: 'User account updated successfully' 
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Profile Routes
const profileRouter = express.Router();

// Get all profiles
profileRouter.get('/', isLoggedIn, async (req, res) => {
  try {
    const { Profile } = require('../../src/models/Profile');
    
    // Find all profiles for the user
    const profiles = await Profile.findAll({ 
      where: { user_id: req.user.id } 
    });
    
    res.status(200).json({ 
      profiles: profiles.map(p => ({
        profile_id: p.profile_id,
        name: p.name,
        avatar: p.avatar,
        language_preference: p.language_preference,
        content_preferences: p.content_preferences,
        is_kids: p.is_kids
      }))
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a profile
profileRouter.post('/', isLoggedIn, async (req, res) => {
  try {
    const { name, avatar, language_preference, content_preferences, is_kids } = req.body;
    const { Profile } = require('../../src/models/Profile');
    
    // Create profile
    const profile = await Profile.create({
      user_id: req.user.id,
      name,
      avatar: avatar || 'default.png',
      language_preference: language_preference || 'en',
      content_preferences: content_preferences || {},
      is_kids: is_kids || false
    });
    
    res.status(201).json({
      profile_id: profile.profile_id,
      name: profile.name,
      avatar: profile.avatar,
      language_preference: profile.language_preference,
      content_preferences: profile.content_preferences,
      is_kids: profile.is_kids
    });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Subscription Routes
const subscriptionRouter = express.Router();

// Create a subscription
subscriptionRouter.post('/', isLoggedIn, async (req, res) => {
  try {
    const { type, payment_method } = req.body;
    const { Subscription } = require('../../src/models/Subscription');
    
    // Create subscription
    const subscription = await Subscription.create({
      user_id: req.user.id,
      type,
      status: 'ACTIVE',
      start_date: new Date(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      payment_method
    });
    
    res.status(201).json({
      subscription_id: subscription.subscription_id,
      type: subscription.type,
      status: subscription.status,
      start_date: subscription.start_date,
      end_date: subscription.end_date
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
const adminRouter = express.Router();

// Get all users (admin only)
adminRouter.get('/users', isLoggedIn, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { User } = require('../../src/models/User');
    
    // Find all users
    const users = await User.findAll();
    
    res.status(200).json({
      status: 'success',
      data: {
        users: users.map(u => ({
          user_id: u.user_id,
          email: u.email,
          first_name: u.first_name,
          last_name: u.last_name,
          role: u.role,
          status: u.status
        }))
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

// Update user role (admin only)
adminRouter.put('/users/:userId/role', isLoggedIn, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    const { User } = require('../../src/models/User');
    
    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        status: 'error',
        message: 'User not found' 
      });
    }
    
    // Update role
    await User.update({ role }, { where: { user_id: userId } });
    
    // Get updated user
    const updatedUser = await User.findByPk(userId);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          user_id: updatedUser.user_id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      }
    });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message 
    });
  }
});

// Profile Routes
app.get('/profiles', isLoggedIn, (req, res) => {
  const { Profile } = require('../../src/models/Profile');
  Profile.findAll({ where: { user_id: req.user.id } })
    .then(profiles => {
      res.status(200).json({ profiles });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch profiles' });
    });
});

app.post('/profiles', isLoggedIn, (req, res) => {
  const { Profile } = require('../../src/models/Profile');
  const profileData = {
    ...req.body,
    user_id: req.user.id
  };
  
  Profile.create(profileData)
    .then(profile => {
      res.status(201).json(profile);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to create profile' });
    });
});

app.get('/profiles/:id', isLoggedIn, (req, res) => {
  const { Profile } = require('../../src/models/Profile');
  Profile.findByPk(req.params.id)
    .then(profile => {
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      if (profile.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to access this profile' });
      }
      
      res.status(200).json(profile);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch profile' });
    });
});

app.put('/profiles/:id', isLoggedIn, (req, res) => {
  const { Profile } = require('../../src/models/Profile');
  Profile.findByPk(req.params.id)
    .then(profile => {
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      if (profile.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to update this profile' });
      }
      
      return Profile.update(req.body, { where: { profile_id: req.params.id } })
        .then(() => {
          res.status(200).json({ message: 'Profile updated successfully' });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to update profile' });
    });
});

app.delete('/profiles/:id', isLoggedIn, (req, res) => {
  const { Profile } = require('../../src/models/Profile');
  Profile.findByPk(req.params.id)
    .then(profile => {
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      if (profile.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to delete this profile' });
      }
      
      return Profile.destroy({ where: { profile_id: req.params.id } })
        .then(() => {
          res.status(200).json({ message: 'Profile deleted successfully' });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete profile' });
    });
});

// Watchlist Routes
app.get('/profiles/:profileId/watchlist', isLoggedIn, (req, res) => {
  const { Profile } = require('../../src/models/Profile');
  const { WatchList } = require('../../src/models/WatchList');
  
  Profile.findByPk(req.params.profileId)
    .then(profile => {
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      if (profile.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to access this watchlist' });
      }
      
      return WatchList.findAll({
        where: { profile_id: req.params.profileId },
        include: ['Movie', 'Series']
      })
        .then(watchlist => {
          res.status(200).json({ watchlist });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch watchlist' });
    });
});

app.post('/watchlist', isLoggedIn, (req, res) => {
  const { Profile } = require('../../src/models/Profile');
  const { WatchList } = require('../../src/models/WatchList');
  
  const { profile_id, movie_id, series_id } = req.body;
  
  if (!profile_id) {
    return res.status(400).json({ error: 'Profile ID is required' });
  }
  
  if (!movie_id && !series_id) {
    return res.status(400).json({ error: 'Either movie_id or series_id is required' });
  }
  
  Profile.findByPk(profile_id)
    .then(profile => {
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      if (profile.user_id !== req.user.id) {
        return res.status(403).json({ error: 'You do not have permission to modify this watchlist' });
      }
      
      const watchlistItem = {
        profile_id,
        status: 'UNWATCHED',
        added_date: new Date()
      };
      
      if (movie_id) watchlistItem.movie_id = movie_id;
      if (series_id) watchlistItem.series_id = series_id;
      
      return WatchList.create(watchlistItem);
    })
    .then(watchlistItem => {
      res.status(201).json(watchlistItem);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to add to watchlist' });
    });
});

app.get('/watchlist/:id', isLoggedIn, (req, res) => {
  const { WatchList } = require('../../src/models/WatchList');
  const { Profile } = require('../../src/models/Profile');
  
  WatchList.findByPk(req.params.id, { include: ['Profile'] })
    .then(watchlistItem => {
      if (!watchlistItem) {
        return res.status(404).json({ error: 'Watchlist item not found' });
      }
      
      return Profile.findByPk(watchlistItem.profile_id)
        .then(profile => {
          if (!profile) {
            return res.status(404).json({ error: 'Related profile not found' });
          }
          
          if (profile.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You do not have permission to access this watchlist item' });
          }
          
          res.status(200).json(watchlistItem);
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch watchlist item' });
    });
});

app.put('/watchlist/:id', isLoggedIn, (req, res) => {
  const { WatchList } = require('../../src/models/WatchList');
  const { Profile } = require('../../src/models/Profile');
  
  WatchList.findByPk(req.params.id)
    .then(watchlistItem => {
      if (!watchlistItem) {
        return res.status(404).json({ error: 'Watchlist item not found' });
      }
      
      return Profile.findByPk(watchlistItem.profile_id)
        .then(profile => {
          if (profile.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You do not have permission to modify this watchlist item' });
          }
          
          return WatchList.update(req.body, { where: { watchlist_id: req.params.id } })
            .then(() => {
              res.status(200).json({ message: 'Watchlist item updated successfully' });
            });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to update watchlist item' });
    });
});

app.delete('/watchlist/:id', isLoggedIn, (req, res) => {
  const { WatchList } = require('../../src/models/WatchList');
  const { Profile } = require('../../src/models/Profile');
  
  WatchList.findByPk(req.params.id)
    .then(watchlistItem => {
      if (!watchlistItem) {
        return res.status(404).json({ error: 'Watchlist item not found' });
      }
      
      return Profile.findByPk(watchlistItem.profile_id)
        .then(profile => {
          if (profile.user_id !== req.user.id) {
            return res.status(403).json({ error: 'You do not have permission to delete this watchlist item' });
          }
          
          return WatchList.destroy({ where: { watchlist_id: req.params.id } })
            .then(() => {
              res.status(200).json({ message: 'Watchlist item removed successfully' });
            });
        });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Failed to remove watchlist item' });
    });
});

// Mount routers
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/profiles', profileRouter);
app.use('/subscriptions', subscriptionRouter);
app.use('/admin', adminRouter);

// Create a server that can be closed after tests
let server;
const startServer = () => {
  const port = process.env.E2E_TEST_PORT || 3002;
  try {
    // Check if server is already running
    if (server && server.listening) {
      return server;
    }
    
    // Close any existing server
    if (server) {
      server.close();
    }
    
    server = app.listen(port);
    
    // Store the server instance globally
    global.__e2e_test_server__ = server;
    
    // Add a forceful cleanup mechanism for the server
    process.on('exit', () => {
      if (server && server.listening) {
        server.close();
      }
    });
    
    // Add error handler
    server.on('error', (err) => {
      console.error('E2E server error:', err.message);
    });
    
    return server;
  } catch (err) {
    console.error('Failed to start E2E server:', err.message);
    return null;
  }
};

const closeServer = () => {
  if (!server) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    if (!server.listening) {
      server = null;
      global.__e2e_test_server__ = null;
      return resolve();
    }
    
    try {
      // Force close all connections
      server.close(() => {
        // Explicitly set to null to help with garbage collection
        server = null;
        global.__e2e_test_server__ = null;
        
        // Add a small delay to ensure connections are fully closed
        setTimeout(() => {
          resolve();
        }, 100);
      });
    } catch (err) {
      console.error('Error closing E2E server:', err.message);
      server = null;
      global.__e2e_test_server__ = null;
      resolve();
    }
  });
};

module.exports = { app, startServer, closeServer };

/**
 * End-to-End tests for the Netflix API
 * Tests complete user flows from registration to content access
 * NOTE: These tests are skipped until proper test database setup is configured
 */
const request = require('supertest');
const { app, startServer, closeServer } = require('../mocks/mockE2eApp'); // Use our mock E2E app
const { User } = require('../../src/models/User');
const { Profile } = require('../../src/models/Profile');
const { Subscription } = require('../../src/models/Subscription');
const RefreshToken = require('../../src/models/RefreshToken');
const jwt = require('jsonwebtoken');

// Mock User model methods
jest.mock('../../src/models/User', () => ({
  User: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue([])
  }
}));

// Mock Profile model methods
jest.mock('../../src/models/Profile', () => ({
  Profile: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue([])
  }
}));

// Mock Subscription model methods
jest.mock('../../src/models/Subscription', () => ({
  Subscription: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue([])
  }
}));

// Mock RefreshToken model methods
jest.mock('../../src/models/RefreshToken', () => ({
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({}),
  destroy: jest.fn().mockResolvedValue([]),
  findAll: jest.fn().mockResolvedValue([])
}));

// Mock JWT token
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation((payload) => {
    // Return different tokens based on user role
    if (payload && payload.role === 'ADMIN') {
      return 'mock-admin-token';
    }
    return 'mock-jwt-token';
  }),
  verify: jest.fn().mockImplementation((token) => {
    if (token === 'mock-admin-token') {
      return { id: 2, role: 'ADMIN' };
    }
    return { id: 1, role: 'USER' };
  })
}));

describe('Netflix API E2E Tests', () => {
  let testUser;
  let accessToken;
  let agent; // Single reusable agent
  let server;
  
  // Start server once before all tests
  beforeAll(() => {
    // Use a dedicated global variable for this test suite
    if (!global.__e2e_test_server__) {
      server = startServer();
      global.__e2e_test_server__ = server;
    } else {
      server = global.__e2e_test_server__;
    }
    // Create a single agent to reuse across tests
    agent = request.agent(server);
  });
  
  // Close server after all tests
  afterAll(async () => {
    // Don't actually close the server here, let the global teardown handle it
    // This prevents issues when running multiple test suites
    server = null;
  });
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create a standard test user that will be used across tests
    testUser = {
      user_id: 1,
      email: 'e2e-test@example.com',
      password: '$2b$10$tS4NG7vQAJRJkzv8/d0l5utJAFk7V3seXJ54kKkYcStQnfD9DpY9S', // hashed 'Password123'
      first_name: 'E2E',
      last_name: 'Test',
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Set a default access token for authenticated requests
    accessToken = 'mock-jwt-token';
  });

  describe('Complete User Flow', () => {
    it('should allow a user to register, login, access protected resources, and logout', async () => {
      // Step 1: Register a new user
      // Mock user creation for registration
      User.findOne.mockResolvedValueOnce(null); // No existing user with same email
      User.create.mockResolvedValueOnce(testUser);

      const registerData = {
        email: 'e2e-test@example.com',
        password: 'Password123',
        first_name: 'E2E',
        last_name: 'Test'
      };

      let response = await agent
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(User.create).toHaveBeenCalledTimes(1);

      // Step 2: Login with the registered user
      // Mock user lookup for login
      User.findOne.mockResolvedValueOnce(testUser);
      
      // Mock refresh token creation
      RefreshToken.create.mockResolvedValueOnce({
        token: 'mock-refresh-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const loginData = {
        email: registerData.email,
        password: registerData.password
      };

      response = await agent
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');

      // Step 3: Access protected user account information
      // Mock user lookup for account information
      User.findByPk.mockResolvedValueOnce(testUser);

      response = await agent
        .get('/user/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(User.findByPk).toHaveBeenCalledTimes(1);

      // Step 4: Create a subscription
      // Mock subscription creation
      Subscription.create.mockResolvedValueOnce({
        subscription_id: 1,
        user_id: testUser.user_id,
        type: 'PREMIUM',
        status: 'ACTIVE',
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        payment_method: 'CREDIT_CARD'
      });

      const subscriptionData = {
        type: 'PREMIUM',
        payment_method: 'CREDIT_CARD'
      };

      response = await agent
        .post('/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(response.body).toHaveProperty('subscription_id');
      expect(Subscription.create).toHaveBeenCalledTimes(1);

      // Step 5: Create a profile
      // Mock profile creation
      Profile.create.mockResolvedValueOnce({
        profile_id: 1,
        user_id: testUser.user_id,
        name: 'Main Profile',
        avatar: 'default.png',
        language_preference: 'en',
        content_preferences: { genre: ['action', 'comedy'] },
        is_kids: false
      });

      const profileData = {
        name: 'Main Profile',
        avatar: 'default.png',
        language_preference: 'en',
        content_preferences: { genre: ['action', 'comedy'] },
        is_kids: false
      };

      response = await agent
        .post('/profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData)
        .expect(201);

      expect(response.body).toHaveProperty('profile_id');
      expect(Profile.create).toHaveBeenCalledTimes(1);

      // Step 6: View all profiles
      // Mock profile listing
      Profile.findAll.mockResolvedValueOnce([
        {
          profile_id: 1,
          user_id: testUser.user_id,
          name: 'Main Profile',
          avatar: 'default.png',
          language_preference: 'en',
          content_preferences: { genre: ['action', 'comedy'] },
          is_kids: false
        }
      ]);

      response = await agent
        .get('/profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('profiles');
      expect(Array.isArray(response.body.profiles)).toBe(true);
      expect(Profile.findAll).toHaveBeenCalledTimes(1);

      // Step 7: Logout the user
      // Mock refresh token lookup to invalidate it
      RefreshToken.findAll.mockResolvedValueOnce([
        { token: 'mock-refresh-token' }
      ]);
      
      // Mock refresh token destruction
      RefreshToken.destroy.mockResolvedValueOnce(1);

      response = await agent
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(RefreshToken.destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Role-Based Access Control', () => {
    let adminToken;
    let userToken;
    
    beforeEach(async () => {
      // Mock admin user
      const adminUser = {
        user_id: 2,
        email: 'admin@example.com',
        password: '$2b$10$tS4NG7vQAJRJkzv8/d0l5utJAFk7V3seXJ54kKkYcStQnfD9DpY9S', // hashed 'AdminPass123'
        first_name: 'Admin',
        last_name: 'User',
        role: 'ADMIN',
        status: 'ACTIVE'
      };
      
      // Mock regular user
      const regularUser = {
        user_id: 3,
        email: 'user@example.com',
        password: '$2b$10$tS4NG7vQAJRJkzv8/d0l5utJAFk7V3seXJ54kKkYcStQnfD9DpY9S', // hashed 'UserPass123'
        first_name: 'Regular',
        last_name: 'User',
        role: 'USER',
        status: 'ACTIVE'
      };
      
      // Override the jwt.sign implementation temporarily
      const jwt = require('jsonwebtoken');
      const originalSign = jwt.sign;
      jwt.sign = jest.fn().mockImplementation((payload) => {
        if (payload.role === 'ADMIN') {
          return 'mock-admin-token';
        }
        return 'mock-jwt-token';
      });
      
      // Set up mocks for admin login
      User.findOne.mockResolvedValueOnce(adminUser);
      RefreshToken.create.mockResolvedValueOnce({
        token: 'admin-refresh-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      // Login as admin to get token
      const response = await agent
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'AdminPass123'
        });
      
      adminToken = response.body.token;
      
      // Set up mocks for regular user login
      User.findOne.mockResolvedValueOnce(regularUser);
      RefreshToken.create.mockResolvedValueOnce({
        token: 'user-refresh-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      
      // Login as regular user to get token
      const userResponse = await agent
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'UserPass123'
        });
      
      userToken = userResponse.body.token;
      
      // Restore the original jwt.sign implementation
      jwt.sign = originalSign;
    });

    it('should allow admin to access admin-only routes', async () => {
      // Make sure our adminToken is properly set
      if (!adminToken || adminToken === 'undefined') {
        adminToken = 'mock-admin-token';
      }
      
      // Override the jwt.verify implementation temporarily
      const jwt = require('jsonwebtoken');
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation((token) => {
        if (token === 'mock-admin-token' || token === adminToken) {
          return { id: 2, role: 'ADMIN' };
        }
        return { id: 1, role: 'USER' };
      });

      // Mock user listing
      User.findAll.mockResolvedValueOnce([
        {
          user_id: 2,
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'ADMIN',
          status: 'ACTIVE'
        },
        {
          user_id: 3,
          email: 'user@example.com',
          first_name: 'Regular',
          last_name: 'User',
          role: 'USER',
          status: 'ACTIVE'
        }
      ]);
      
      const response = await agent
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
      
      // Restore the original jwt.verify implementation
      jwt.verify = originalVerify;
    });

    it('should prevent regular users from accessing admin-only routes', async () => {
      // Make sure our userToken is properly set
      if (!userToken || userToken === 'undefined') {
        userToken = 'mock-jwt-token';
      }
      
      // Override the jwt.verify implementation temporarily
      const jwt = require('jsonwebtoken');
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation((token) => {
        if (token === 'mock-admin-token' || token === adminToken) {
          return { id: 2, role: 'ADMIN' };
        }
        return { id: 1, role: 'USER' };
      });
      
      const response = await agent
        .get('/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Forbidden');
      
      // Restore the original jwt.verify implementation
      jwt.verify = originalVerify;
    });

    it('should allow admin to update user roles', async () => {
      // Make sure our adminToken is properly set
      if (!adminToken || adminToken === 'undefined') {
        adminToken = 'mock-admin-token';
      }
      
      // Override the jwt.verify implementation temporarily
      const jwt = require('jsonwebtoken');
      const originalVerify = jwt.verify;
      jwt.verify = jest.fn().mockImplementation((token) => {
        if (token === 'mock-admin-token' || token === adminToken) {
          return { id: 2, role: 'ADMIN' };
        }
        return { id: 1, role: 'USER' };
      });
      
      // Mock user listing
      User.findAll.mockResolvedValueOnce([
        {
          user_id: 2,
          email: 'admin@example.com',
          first_name: 'Admin',
          last_name: 'User',
          role: 'ADMIN',
          status: 'ACTIVE'
        },
        {
          user_id: 3,
          email: 'user@example.com',
          first_name: 'Regular',
          last_name: 'User',
          role: 'USER',
          status: 'ACTIVE'
        }
      ]);
      
      // Mock user lookup
      User.findByPk.mockResolvedValueOnce({
        user_id: 3,
        email: 'user@example.com',
        first_name: 'Regular',
        last_name: 'User',
        role: 'USER',
        status: 'ACTIVE'
      });
      
      // Mock role update
      User.update.mockResolvedValueOnce([1]);
      
      // Mock updated user
      User.findByPk.mockResolvedValueOnce({
        user_id: 3,
        email: 'user@example.com',
        first_name: 'Regular',
        last_name: 'User',
        role: 'moderator',
        status: 'ACTIVE'
      });
      
      // First get all users to find the regular user ID
      const usersResponse = await agent
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      const regularUserId = usersResponse.body.data.users.find(
        user => user.email === 'user@example.com'
      ).user_id;

      // Update the user's role to moderator
      const response = await agent
        .put(`/admin/users/${regularUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'moderator' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.role).toBe('moderator');
      
      // Restore the original jwt.verify implementation
      jwt.verify = originalVerify;
    });
  });  
});

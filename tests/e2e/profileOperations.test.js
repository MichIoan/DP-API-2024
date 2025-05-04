/**
 * End-to-End tests for Profile operations
 * Tests user profile creation, update, and deletion flows
 */
const request = require('supertest');
const { app, startServer, closeServer } = require('../mocks/mockE2eApp');
const { User } = require('../../src/models/User');
const { Profile } = require('../../src/models/Profile');
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

// Mock JWT token
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation(() => 'mock-jwt-token'),
  verify: jest.fn().mockImplementation(() => ({ id: 1, role: 'USER' }))
}));

describe('Profile Operations E2E Tests', () => {
  let server;
  let agent;
  let accessToken;
  
  // Start server once before all tests
  beforeAll(() => {
    // Use a dedicated global variable for this test suite
    if (!global.__profile_test_server__) {
      server = startServer();
      global.__profile_test_server__ = server;
    } else {
      server = global.__profile_test_server__;
    }
    // Create a single agent to reuse across tests
    agent = request.agent(server);
  });
  
  // Let global teardown handle server closure
  afterAll(() => {
    server = null;
  });
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set a default access token for authenticated requests
    accessToken = 'mock-jwt-token';
  });

  describe('Profile Management', () => {
    it('should allow a user to create, update, and delete profiles', async () => {
      // Step 1: Create a new profile
      const testUser = {
        user_id: 1,
        email: 'profile-test@example.com',
        first_name: 'Profile',
        last_name: 'Test',
        role: 'USER',
        status: 'ACTIVE'
      };
      
      // Mock user lookup for authentication
      User.findByPk.mockResolvedValueOnce(testUser);
      
      // Mock profile creation
      Profile.create.mockResolvedValueOnce({
        profile_id: 1,
        user_id: testUser.user_id,
        name: 'Test Profile',
        avatar: 'avatar1.png',
        language_preference: 'en',
        content_preferences: { genres: ['action', 'comedy'] },
        is_kids: false
      });
      
      const profileData = {
        name: 'Test Profile',
        avatar: 'avatar1.png',
        language_preference: 'en',
        content_preferences: { genres: ['action', 'comedy'] },
        is_kids: false
      };
      
      let response = await agent
        .post('/profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(profileData)
        .expect(201);
      
      expect(response.body).toHaveProperty('profile_id');
      expect(Profile.create).toHaveBeenCalledTimes(1);
      expect(Profile.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: testUser.user_id,
        name: profileData.name
      }));
      
      // Step 2: Get all profiles
      Profile.findAll.mockResolvedValueOnce([
        {
          profile_id: 1,
          user_id: testUser.user_id,
          name: 'Test Profile',
          avatar: 'avatar1.png',
          language_preference: 'en',
          content_preferences: { genres: ['action', 'comedy'] },
          is_kids: false
        }
      ]);
      
      response = await agent
        .get('/profiles')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('profiles');
      expect(Array.isArray(response.body.profiles)).toBe(true);
      expect(response.body.profiles.length).toBe(1);
      expect(response.body.profiles[0].name).toBe('Test Profile');
      
      // Step 3: Update a profile
      Profile.findByPk.mockResolvedValueOnce({
        profile_id: 1,
        user_id: testUser.user_id,
        name: 'Test Profile',
        avatar: 'avatar1.png',
        language_preference: 'en',
        content_preferences: { genres: ['action', 'comedy'] },
        is_kids: false
      });
      
      Profile.update.mockResolvedValueOnce([1]);
      
      const updatedProfileData = {
        name: 'Updated Profile',
        avatar: 'avatar2.png',
        language_preference: 'es',
        content_preferences: { genres: ['drama', 'sci-fi'] },
        is_kids: true
      };
      
      response = await agent
        .put('/profiles/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updatedProfileData)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(Profile.update).toHaveBeenCalledTimes(1);
      expect(Profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: updatedProfileData.name,
          avatar: updatedProfileData.avatar
        }),
        expect.any(Object)
      );
      
      // Step 4: Delete a profile
      Profile.findByPk.mockResolvedValueOnce({
        profile_id: 1,
        user_id: testUser.user_id,
        name: 'Updated Profile',
        avatar: 'avatar2.png',
        language_preference: 'es',
        content_preferences: { genres: ['drama', 'sci-fi'] },
        is_kids: true
      });
      
      Profile.destroy.mockResolvedValueOnce(1);
      
      response = await agent
        .delete('/profiles/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(Profile.destroy).toHaveBeenCalledTimes(1);
    });
    
    it('should prevent unauthorized access to profiles', async () => {
      // Test accessing profiles without authentication
      const response = await agent
        .get('/profiles')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should prevent a user from accessing another user\'s profiles', async () => {
      // Mock profile lookup for a different user
      Profile.findByPk.mockResolvedValueOnce({
        profile_id: 2,
        user_id: 999, // Different user ID
        name: 'Other User Profile',
        avatar: 'avatar3.png',
        language_preference: 'fr',
        content_preferences: { genres: ['horror'] },
        is_kids: false
      });
      
      const response = await agent
        .get('/profiles/2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle profile not found errors', async () => {
      // Mock profile lookup returning null (not found)
      Profile.findByPk.mockResolvedValueOnce(null);
      
      const response = await agent
        .get('/profiles/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});

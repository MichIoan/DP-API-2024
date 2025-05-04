/**
 * End-to-End tests for Watchlist operations
 * Tests watchlist item management for movies and series
 */
const request = require('supertest');
const { app, startServer, closeServer } = require('../mocks/mockE2eApp');
const jwt = require('jsonwebtoken');

// Mock models before importing them
jest.mock('../../src/models/User', () => ({
  User: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue({
      user_id: 1,
      email: 'watchlist-test@example.com',
      role: 'USER',
      status: 'ACTIVE'
    }),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  }
}));

jest.mock('../../src/models/Profile', () => ({
  Profile: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue({
      profile_id: 1,
      user_id: 1,
      name: 'Test Profile'
    }),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  }
}));

jest.mock('../../src/models/WatchList', () => ({
  WatchList: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue({
      watchlist_id: 1,
      profile_id: 1,
      movie_id: 1,
      series_id: null,
      added_date: new Date(),
      status: 'UNWATCHED'
    }),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  }
}));

jest.mock('../../src/models/Movie', () => ({
  Movie: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue({
      movie_id: 1,
      title: 'Test Movie',
      genre: 'Action'
    }),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  }
}));

jest.mock('../../src/models/Series', () => ({
  Series: {
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue({
      series_id: 1,
      title: 'Test Series',
      genre: 'Drama'
    }),
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1)
  }
}));

// Mock JWT token
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockImplementation(() => 'mock-jwt-token'),
  verify: jest.fn().mockImplementation(() => ({ id: 1, role: 'USER' }))
}));

// Import the mocked models
const { User } = require('../../src/models/User');
const { Profile } = require('../../src/models/Profile');
const { WatchList } = require('../../src/models/WatchList');
const { Movie } = require('../../src/models/Movie');
const { Series } = require('../../src/models/Series');

describe('Watchlist Operations E2E Tests', () => {
  let server;
  let agent;
  let accessToken;
  
  // Start server once before all tests
  beforeAll(() => {
    // Use a dedicated global variable for this test suite
    if (!global.__watchlist_test_server__) {
      server = startServer();
      global.__watchlist_test_server__ = server;
    } else {
      server = global.__watchlist_test_server__;
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
    
    // Set a default access token for authenticated requests
    accessToken = 'mock-jwt-token';
  });

  describe('Watchlist Management', () => {
    it('should allow a user to add a movie to watchlist', async () => {
      WatchList.create.mockResolvedValueOnce({
        watchlist_id: 1,
        profile_id: 1,
        movie_id: 1,
        series_id: null,
        added_date: new Date(),
        status: 'UNWATCHED'
      });
      
      const response = await agent
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profile_id: 1,
          movie_id: 1,
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('watchlist_id');
      expect(WatchList.create).toHaveBeenCalledTimes(1);
      expect(WatchList.create).toHaveBeenCalledWith(expect.objectContaining({
        profile_id: 1,
        movie_id: 1
      }));
    });
    
    it('should allow a user to add a series to watchlist', async () => {
      WatchList.create.mockResolvedValueOnce({
        watchlist_id: 2,
        profile_id: 1,
        movie_id: null,
        series_id: 1,
        added_date: new Date(),
        status: 'UNWATCHED'
      });
      
      const response = await agent
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profile_id: 1,
          series_id: 1,
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('watchlist_id');
      expect(WatchList.create).toHaveBeenCalledTimes(1);
      expect(WatchList.create).toHaveBeenCalledWith(expect.objectContaining({
        profile_id: 1,
        series_id: 1
      }));
    });
    
    it('should retrieve all watchlist items for a profile', async () => {
      WatchList.findAll.mockResolvedValueOnce([
        {
          watchlist_id: 1,
          profile_id: 1,
          movie_id: 1,
          series_id: null,
          added_date: new Date(),
          status: 'UNWATCHED',
          Movie: {
            movie_id: 1,
            title: 'Test Movie',
            genre: 'Action'
          }
        },
        {
          watchlist_id: 2,
          profile_id: 1,
          movie_id: null,
          series_id: 1,
          added_date: new Date(),
          status: 'UNWATCHED',
          Series: {
            series_id: 1,
            title: 'Test Series',
            genre: 'Drama'
          }
        }
      ]);
      
      const response = await agent
        .get('/profiles/1/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('watchlist');
      expect(Array.isArray(response.body.watchlist)).toBe(true);
      expect(response.body.watchlist.length).toBe(2);
      expect(WatchList.findAll).toHaveBeenCalledTimes(1);
    });
    
    it('should update watchlist item status', async () => {
      WatchList.findByPk.mockResolvedValueOnce({
        watchlist_id: 1,
        profile_id: 1,
        movie_id: 1,
        series_id: null,
        added_date: new Date(),
        status: 'UNWATCHED'
      });
      
      WatchList.update.mockResolvedValueOnce([1]);
      
      const response = await agent
        .put('/watchlist/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'WATCHED'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(WatchList.update).toHaveBeenCalledTimes(1);
      expect(WatchList.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'WATCHED' }),
        expect.any(Object)
      );
    });
    
    it('should remove an item from watchlist', async () => {
      WatchList.findByPk.mockResolvedValueOnce({
        watchlist_id: 1,
        profile_id: 1,
        movie_id: 1,
        series_id: null,
        added_date: new Date(),
        status: 'UNWATCHED'
      });
      
      WatchList.destroy.mockResolvedValueOnce(1);
      
      const response = await agent
        .delete('/watchlist/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(WatchList.destroy).toHaveBeenCalledTimes(1);
    });
    
    it('should prevent unauthorized access to watchlist', async () => {
      const response = await agent
        .get('/profiles/1/watchlist')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should prevent a user from accessing another user\'s watchlist', async () => {
      // Mock profile lookup for a different user
      Profile.findByPk.mockResolvedValueOnce({
        profile_id: 2,
        user_id: 999, // Different user ID
        name: 'Other User Profile'
      });
      
      const response = await agent
        .get('/profiles/2/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should handle watchlist not found errors', async () => {
      // Mock watchlist lookup returning null (not found)
      WatchList.findByPk.mockResolvedValueOnce(null);
      
      const response = await agent
        .get('/watchlist/999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('error');
    });
    
    it('should validate input when adding items to watchlist', async () => {
      // Test invalid input (missing both movie_id and series_id)
      const response = await agent
        .post('/watchlist')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profile_id: 1
          // Missing movie_id or series_id
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});

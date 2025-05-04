/**
 * Integration tests for auth routes
 * NOTE: These tests are skipped until proper test database setup is configured
 */
const request = require('supertest');
const { app, startServer, closeServer } = require('../mocks/mockApp'); // Use our mock app with server control
const { User } = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const jwt = require('jsonwebtoken');

// Mock User model methods
jest.mock('../../src/models/User', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn().mockResolvedValue([]),
    count: jest.fn()
  }
}));

// Mock RefreshToken model methods
jest.mock('../../src/models/RefreshToken', () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn().mockResolvedValue([]),
  count: jest.fn()
}));

describe('Auth Routes', () => {
  let server;
  let agent;

  // Start server before all tests and create a single agent to reuse
  beforeAll(() => {
    // Use a dedicated global variable for this test suite
    if (!global.__test_server__) {
      server = startServer();
      global.__test_server__ = server;
    } else {
      server = global.__test_server__;
    }
    // Create a single agent that will reuse connections
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
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      // Mock successful user creation
      User.findOne.mockResolvedValueOnce(null); // No existing user with same email
      User.create.mockResolvedValueOnce({
        user_id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await agent
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(User.create).toHaveBeenCalledTimes(1);
    });

    it('should return 400 if email is missing', async () => {
      const userData = {
        password: 'Password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await agent
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 409 if email is already in use', async () => {
      // Mock existing user
      User.findOne.mockResolvedValueOnce({
        user_id: 1,
        email: 'existing@example.com'
      });

      const userData = {
        email: 'existing@example.com',
        password: 'Password123',
        first_name: 'Test',
        last_name: 'User'
      };

      await agent
        .post('/auth/register')
        .send(userData)
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user successfully', async () => {
      // Mock successful user lookup
      User.findOne.mockResolvedValueOnce({
        user_id: 1,
        email: 'test@example.com',
        password: '$2b$10$tS4NG7vQAJRJkzv8/d0l5utJAFk7V3seXJ54kKkYcStQnfD9DpY9S', // hashed 'Password123'
        first_name: 'Test',
        last_name: 'User',
        status: 'ACTIVE',
        role: 'USER'
      });

      // Mock refresh token creation
      RefreshToken.create.mockResolvedValueOnce({
        token: 'mock-refresh-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const loginData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      const response = await agent
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('should return 400 if email is missing', async () => {
      const loginData = {
        password: 'Password123'
      };

      await agent
        .post('/auth/login')
        .send(loginData)
        .expect(400);
    });

    it('should return 401 if credentials are invalid', async () => {
      // Mock user lookup
      User.findOne.mockResolvedValueOnce({
        user_id: 1,
        email: 'test@example.com',
        password: '$2b$10$tS4NG7vQAJRJkzv8/d0l5utJAFk7V3seXJ54kKkYcStQnfD9DpY9S', // hashed 'Password123'
        status: 'ACTIVE'
      });

      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      await agent
        .post('/auth/login')
        .send(loginData)
        .expect(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('should refresh token successfully', async () => {
      // Mock valid refresh token
      RefreshToken.findOne.mockResolvedValueOnce({
        user_id: 1,
        token: 'valid-refresh-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_revoked: false
      });

      // Mock user lookup
      User.findOne.mockResolvedValueOnce({
        user_id: 1,
        email: 'test@example.com',
        role: 'USER',
        status: 'ACTIVE'
      });

      const response = await agent
        .post('/auth/refresh-token')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 400 if refresh token is missing', async () => {
      await agent
        .post('/auth/refresh-token')
        .send({})
        .expect(400);
    });

    it('should return 401 if refresh token is invalid', async () => {
      // Mock invalid refresh token (not found)
      RefreshToken.findOne.mockResolvedValueOnce(null);

      await agent
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });
});

/**
 * Integration tests for auth routes
 */
const request = require('supertest');
const app = require('../../app');
const { User } = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const sequelize = require('../../src/config/sequelize');
const bcrypt = require('bcrypt');

describe('Auth Routes', () => {
  beforeAll(async () => {
    // Connect to test database and sync models
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clear database tables before each test
    await User.destroy({ where: {}, force: true });
    await RefreshToken.destroy({ where: {}, force: true });
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toBe('User was created successfully.');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned

      // Verify user was created in database
      const user = await User.findOne({ where: { email: userData.email } });
      expect(user).not.toBeNull();
      expect(user.email).toBe(userData.email);
    });

    it('should return 400 if email is missing', async () => {
      const userData = {
        password: 'Password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 if password is missing', async () => {
      const userData = {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 if email format is invalid', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 409 if email is already in use', async () => {
      // Create a user first
      await User.create({
        email: 'existing@example.com',
        password: await bcrypt.hash('Password123', 10),
        first_name: 'Existing',
        last_name: 'User'
      });

      // Try to register with the same email
      const userData = {
        email: 'existing@example.com',
        password: 'Password123',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        first_name: 'Test',
        last_name: 'User',
        activation_status: 'active'
      });
    });

    it('should login a user successfully', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'Password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.tokenType).toBe('Bearer');
      expect(response.body.data.expiresIn).toBeDefined();

      // Verify refresh token was created in database
      const refreshTokenCount = await RefreshToken.count({ 
        where: { user_id: response.body.data.user.user_id } 
      });
      expect(refreshTokenCount).toBe(1);
    });

    it('should return 400 if email is missing', async () => {
      const loginData = {
        password: 'Password123'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 if password is missing', async () => {
      const loginData = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 if credentials are invalid', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('POST /auth/refresh-token', () => {
    let refreshToken;
    let userId;

    beforeEach(async () => {
      // Create a test user
      const user = await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        first_name: 'Test',
        last_name: 'User',
        activation_status: 'active'
      });
      userId = user.user_id;

      // Create a refresh token
      const token = await RefreshToken.create({
        user_id: userId,
        token: 'valid-refresh-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in the future
        is_revoked: false,
        ip_address: '127.0.0.1',
        user_agent: 'test-agent'
      });
      refreshToken = token.token;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.tokenType).toBe('Bearer');
      expect(response.body.data.expiresIn).toBeDefined();
    });

    it('should return 400 if refresh token is missing', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({})
        .expect(400);

      expect(response.body.status).toBe('error');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 if refresh token is invalid', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Invalid refresh token');
    });
  });
});

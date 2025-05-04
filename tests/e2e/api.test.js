/**
 * End-to-End tests for the Netflix API
 * Tests complete user flows from registration to content access
 * NOTE: These tests are skipped until proper test database setup is configured
 */
const request = require('supertest');
const app = require('../../app');
const { User } = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const sequelize = require('../../src/config/sequelize');
const bcrypt = require('bcrypt');

// Skip all tests in this file until proper test database is configured
describe.skip('Netflix API E2E Tests', () => {
  let accessToken;
  let refreshToken;
  let userId;
  
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

  describe('Complete User Flow', () => {
    it('should allow a user to register, login, access protected resources, and logout', async () => {
      // Step 1: Register a new user
      const registerData = {
        email: 'e2e-test@example.com',
        password: 'Password123',
        first_name: 'E2E',
        last_name: 'Test'
      };

      let response = await request(app)
        .post('/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user).toBeDefined();
      userId = response.body.data.user.user_id;

      // Step 2: Login with the registered user
      const loginData = {
        email: registerData.email,
        password: registerData.password
      };

      response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;

      // Step 3: Access protected user account information
      response = await request(app)
        .get('/user/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user_id).toBe(userId);
      expect(response.body.data.email).toBe(registerData.email);

      // Step 4: Update user account information
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name'
      };

      response = await request(app)
        .put('/user/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('updated');

      // Step 5: Verify updated information
      response = await request(app)
        .get('/user/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.first_name).toBe(updateData.first_name);
      expect(response.body.data.last_name).toBe(updateData.last_name);

      // Step 6: Refresh the access token
      response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.accessToken).toBeDefined();
      
      // Update access token
      accessToken = response.body.data.accessToken;

      // Step 7: Verify the new access token works
      response = await request(app)
        .get('/user/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');

      // Step 8: Logout
      response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('logged out');

      // Step 9: Verify access token no longer works
      response = await request(app)
        .get('/user/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.status).toBe('error');

      // Step 10: Verify refresh token no longer works
      response = await request(app)
        .post('/auth/refresh-token')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.status).toBe('error');
    });
  });

  describe('Role-Based Access Control', () => {
    beforeEach(async () => {
      // Create admin user
      const adminUser = await User.create({
        email: 'admin@example.com',
        password: await bcrypt.hash('AdminPass123', 10),
        first_name: 'Admin',
        last_name: 'User',
        activation_status: 'active',
        role: 'admin'
      });

      // Create regular user
      const regularUser = await User.create({
        email: 'user@example.com',
        password: await bcrypt.hash('UserPass123', 10),
        first_name: 'Regular',
        last_name: 'User',
        activation_status: 'active',
        role: 'user'
      });

      // Login as admin to get token
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'AdminPass123'
        });

      adminToken = response.body.data.accessToken;

      // Login as regular user to get token
      const userResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@example.com',
          password: 'UserPass123'
        });

      userToken = userResponse.body.data.accessToken;
    });

    it('should allow admin to access admin-only routes', async () => {
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should prevent regular users from accessing admin-only routes', async () => {
      const response = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Forbidden');
    });

    it('should allow admin to update user roles', async () => {
      // Get the user ID
      const usersResponse = await request(app)
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const regularUserId = usersResponse.body.data.users.find(
        user => user.email === 'user@example.com'
      ).user_id;

      // Update the user's role to moderator
      const response = await request(app)
        .put(`/admin/users/${regularUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'moderator' })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.user.role).toBe('moderator');

      // Verify the role was updated in the database
      const updatedUser = await User.findByPk(regularUserId);
      expect(updatedUser.role).toBe('moderator');
    });
  });
});

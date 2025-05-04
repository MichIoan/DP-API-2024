/**
 * Unit tests for the User Service
 */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserService = require('../../src/services/userService');
const { User } = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const UserStatus = require('../../src/models/enums/UserStatus');
const UserRole = require('../../src/models/enums/UserRole');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/models/RefreshToken');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('UserService', () => {
  let userService;
  let mockReq;
  
  beforeEach(() => {
    userService = new UserService();
    mockReq = {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      }
    };
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('registerUser', () => {
    it('should create a new user successfully', async () => {
      // Mock data
      const userData = {
        email: 'test@example.com',
        password: 'Password123',
        first_name: 'Test',
        last_name: 'User'
      };
      
      // Mock User.findOne to return null (no existing user)
      User.findOne.mockResolvedValue(null);
      
      // Mock bcrypt.genSalt and bcrypt.hash
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      
      // Mock User.create to return a new user
      const mockUser = {
        user_id: 1,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        toJSON: jest.fn().mockReturnValue({
          user_id: 1,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name
        })
      };
      User.create.mockResolvedValue(mockUser);
      
      // Call the method
      const result = await userService.registerUser(userData);
      
      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
        transaction: expect.anything()
      });
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 'salt');
      expect(User.create).toHaveBeenCalledWith({
        email: userData.email,
        password: 'hashedPassword',
        first_name: userData.first_name,
        last_name: userData.last_name,
        status: UserStatus.ACTIVE,
        referral_code: expect.any(String),
        referred_by: null
      }, { transaction: expect.anything() });
      expect(result).toEqual({
        user_id: 1,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name
      });
    });
    
    it('should throw an error if email is already in use', async () => {
      // Mock data
      const userData = {
        email: 'existing@example.com',
        password: 'Password123'
      };
      
      // Mock User.findOne to return an existing user
      User.findOne.mockResolvedValue({ email: userData.email });
      
      // Call the method and expect it to throw
      await expect(userService.registerUser(userData)).rejects.toThrow('Email already in use');
      
      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
        transaction: expect.anything()
      });
      expect(User.create).not.toHaveBeenCalled();
    });
  });
  
  describe('loginUser', () => {
    it('should login a user successfully', async () => {
      // Mock data
      const email = 'test@example.com';
      const password = 'Password123';
      
      // Mock user
      const mockUser = {
        user_id: 1,
        email,
        password: 'hashedPassword',
        status: UserStatus.ACTIVE,
        role: UserRole.USER,
        toJSON: jest.fn().mockReturnValue({
          user_id: 1,
          email,
          role: UserRole.USER
        })
      };
      
      // Mock User.findOne
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare
      bcrypt.compare.mockResolvedValue(true);
      
      // Mock token generation
      userService.generateAccessToken = jest.fn().mockReturnValue('access-token');
      userService.generateRefreshToken = jest.fn().mockResolvedValue({
        token: 'refresh-token'
      });
      
      // Call the method
      const result = await userService.loginUser(email, password, mockReq);
      
      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword');
      expect(userService.generateAccessToken).toHaveBeenCalledWith(1);
      expect(userService.generateRefreshToken).toHaveBeenCalledWith(1, mockReq);
      expect(result).toEqual({
        user: {
          user_id: 1,
          email,
          role: UserRole.USER
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: expect.any(String)
      });
    });
    
    it('should throw an error if user is not found', async () => {
      // Mock User.findOne to return null
      User.findOne.mockResolvedValue(null);
      
      // Call the method and expect it to throw
      await expect(userService.loginUser('nonexistent@example.com', 'password', mockReq))
        .rejects.toThrow('Invalid email or password');
      
      expect(User.findOne).toHaveBeenCalledWith({ 
        where: { email: 'nonexistent@example.com' } 
      });
    });
    
    it('should throw an error if password is invalid', async () => {
      // Mock user
      const mockUser = {
        user_id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        status: UserStatus.ACTIVE
      };
      
      // Mock User.findOne
      User.findOne.mockResolvedValue(mockUser);
      
      // Mock bcrypt.compare to return false (invalid password)
      bcrypt.compare.mockResolvedValue(false);
      
      // Call the method and expect it to throw
      await expect(userService.loginUser('test@example.com', 'wrongpassword', mockReq))
        .rejects.toThrow('Invalid email or password');
      
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Mock data
      const refreshTokenString = 'valid-refresh-token';
      
      // Mock RefreshToken.findOne
      const mockRefreshToken = {
        token: refreshTokenString,
        user_id: 1,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in the future
        is_revoked: false
      };
      RefreshToken.findOne.mockResolvedValue(mockRefreshToken);
      
      // Mock User.findByPk
      const mockUser = {
        user_id: 1,
        email: 'test@example.com',
        role: UserRole.USER
      };
      User.findByPk.mockResolvedValue(mockUser);
      
      // Mock token generation
      userService.generateAccessToken = jest.fn().mockReturnValue('new-access-token');
      
      // Call the method
      const result = await userService.refreshToken(refreshTokenString, mockReq);
      
      // Assertions
      expect(RefreshToken.findOne).toHaveBeenCalledWith({ 
        where: { token: refreshTokenString } 
      });
      expect(User.findByPk).toHaveBeenCalledWith(1);
      expect(userService.generateAccessToken).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        tokenType: 'Bearer',
        expiresIn: expect.any(String)
      });
    });
    
    it('should throw an error if refresh token is invalid', async () => {
      // Mock RefreshToken.findOne to return null
      RefreshToken.findOne.mockResolvedValue(null);
      
      // Call the method and expect it to throw
      await expect(userService.refreshToken('invalid-token', mockReq))
        .rejects.toThrow('Invalid refresh token');
      
      expect(RefreshToken.findOne).toHaveBeenCalledWith({ 
        where: { token: 'invalid-token' } 
      });
    });
    
    it('should throw an error if refresh token is expired', async () => {
      // Mock RefreshToken.findOne
      const mockRefreshToken = {
        token: 'expired-token',
        user_id: 1,
        expires_at: new Date(Date.now() - 1000), // In the past
        is_revoked: false
      };
      RefreshToken.findOne.mockResolvedValue(mockRefreshToken);
      
      // Call the method and expect it to throw
      await expect(userService.refreshToken('expired-token', mockReq))
        .rejects.toThrow('Refresh token has expired');
    });
    
    it('should throw an error if refresh token is revoked', async () => {
      // Mock RefreshToken.findOne
      const mockRefreshToken = {
        token: 'revoked-token',
        user_id: 1,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in the future
        is_revoked: true
      };
      RefreshToken.findOne.mockResolvedValue(mockRefreshToken);
      
      // Call the method and expect it to throw
      await expect(userService.refreshToken('revoked-token', mockReq))
        .rejects.toThrow('Refresh token has been revoked');
    });
  });
});

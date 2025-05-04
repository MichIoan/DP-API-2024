/**
 * Unit tests for the Auth Controller
 */
const authController = require('../../src/controllers/authController');
const userService = require('../../src/services/userService');

// Mock userService
jest.mock('../../src/services/userService', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  refreshToken: jest.fn(),
  revokeAllTokens: jest.fn()
}));

describe('AuthController', () => {
  let req, res;
  
  beforeEach(() => {
    // Mock request and response objects
    req = {
      body: {},
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent'
      },
      userId: 1
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      response: jest.fn()
    };
    
    // Mock controller methods
    authController.handleSuccess = jest.fn();
    authController.handleError = jest.fn();
    authController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('register', () => {
    it('should register a new user successfully', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123'
      };
      
      userService.registerUser.mockResolvedValueOnce({
        id: 1,
        email: 'test@example.com',
        status: 'active'
      });
      
      await authController.register(req, res);
      
      expect(authController.validateRequiredFields).toHaveBeenCalledWith(
        req.body,
        ['email', 'password']
      );
      expect(userService.registerUser).toHaveBeenCalledWith({
        email: req.body.email,
        password: req.body.password,
        referral_code: null,
        first_name: null,
        last_name: null
      });
      expect(authController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        201,
        { message: "User was created successfully." }
      );
    });
    
    it('should return error if email and password are missing', async () => {
      authController.validateRequiredFields.mockReturnValueOnce({
        isValid: false,
        message: 'Email and password are required.'
      });
      
      await authController.register(req, res);
      
      expect(authController.validateRequiredFields).toHaveBeenCalledWith(
        req.body,
        ['email', 'password']
      );
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        'Email and password are required.'
      );
      expect(userService.registerUser).not.toHaveBeenCalled();
    });
    
    it('should return error if email format is invalid', async () => {
      req.body = {
        email: 'invalid-email',
        password: 'Password123'
      };
      
      await authController.register(req, res);
      
      expect(authController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        422, 
        "Invalid email format."
      );
      expect(userService.registerUser).not.toHaveBeenCalled();
    });
    
    it('should handle case when email is already in use', async () => {
      req.body = {
        email: 'existing@example.com',
        password: 'Password123'
      };
      
      const error = new Error('Email already in use');
      userService.registerUser.mockRejectedValueOnce(error);
      
      await authController.register(req, res);
      
      expect(userService.registerUser).toHaveBeenCalledWith({
        email: req.body.email,
        password: req.body.password,
        referral_code: null,
        first_name: null,
        last_name: null
      });
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        409,
        'User with this email already exists.'
      );
    });
    
    it('should handle validation errors', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'short'
      };
      
      const error = new Error('Validation error');
      error.name = 'SequelizeValidationError';
      userService.registerUser.mockRejectedValueOnce(error);
      
      await authController.register(req, res);
      
      expect(userService.registerUser).toHaveBeenCalledWith({
        email: req.body.email,
        password: req.body.password,
        referral_code: null,
        first_name: null,
        last_name: null
      });
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        422,
        'Invalid user data provided.',
        error.message
      );
    });
    
    it('should handle general errors', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123'
      };
      
      const error = new Error('Internal server error');
      userService.registerUser.mockRejectedValueOnce(error);
      
      await authController.register(req, res);
      
      expect(userService.registerUser).toHaveBeenCalledWith({
        email: req.body.email,
        password: req.body.password,
        referral_code: null,
        first_name: null,
        last_name: null
      });
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        'Internal server error',
        error.message
      );
    });
  });
  
  describe('login', () => {
    it('should login a user successfully', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123'
      };
      
      const mockLoginResult = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        tokenType: 'Bearer',
        expiresIn: '24h'
      };
      userService.loginUser.mockResolvedValueOnce(mockLoginResult);
      
      await authController.login(req, res);
      
      expect(authController.validateRequiredFields).toHaveBeenCalledWith(
        req.body,
        ['email', 'password']
      );
      expect(userService.loginUser).toHaveBeenCalledWith(
        req.body.email,
        req.body.password,
        req
      );
      expect(authController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        200,
        mockLoginResult
      );
    });
    
    it('should return error if email and password are missing', async () => {
      authController.validateRequiredFields.mockReturnValueOnce({
        isValid: false,
        message: 'Email and password are required.'
      });
      
      await authController.login(req, res);
      
      expect(authController.validateRequiredFields).toHaveBeenCalledWith(
        req.body,
        ['email', 'password']
      );
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        'Email and password are required.'
      );
      expect(userService.loginUser).not.toHaveBeenCalled();
    });
    
    it('should return error if email format is invalid', async () => {
      req.body = {
        email: 'invalid-email',
        password: 'Password123'
      };
      
      await authController.login(req, res);
      
      expect(authController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        422, 
        "Invalid email format."
      );
      expect(userService.loginUser).not.toHaveBeenCalled();
    });
    
    it('should handle invalid credentials', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };
      
      const error = new Error('Invalid email or password');
      userService.loginUser.mockRejectedValueOnce(error);
      
      await authController.login(req, res);
      
      expect(userService.loginUser).toHaveBeenCalledWith(
        req.body.email,
        req.body.password,
        req
      );
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        401,
        'Invalid email or password'
      );
    });
    
    it('should handle inactive account error', async () => {
      req.body = {
        email: 'inactive@example.com',
        password: 'Password123'
      };
      
      const error = new Error('Account is not active');
      userService.loginUser.mockRejectedValueOnce(error);
      
      await authController.login(req, res);
      
      expect(userService.loginUser).toHaveBeenCalledWith(
        req.body.email,
        req.body.password,
        req
      );
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        401,
        'Account is not active'
      );
    });
    
    it('should handle general errors', async () => {
      req.body = {
        email: 'test@example.com',
        password: 'Password123'
      };
      
      const error = new Error('Internal server error');
      userService.loginUser.mockRejectedValueOnce(error);
      
      await authController.login(req, res);
      
      expect(userService.loginUser).toHaveBeenCalledWith(
        req.body.email,
        req.body.password,
        req
      );
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        'Internal server error',
        error.message
      );
    });
  });
  
  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      req.body = {
        refreshToken: 'valid-refresh-token'
      };
      
      const mockRefreshResult = {
        accessToken: 'new-access-token',
        tokenType: 'Bearer',
        expiresIn: '24h'
      };
      userService.refreshToken.mockResolvedValueOnce(mockRefreshResult);
      
      await authController.refreshToken(req, res);
      
      expect(userService.refreshToken).toHaveBeenCalledWith(
        req.body.refreshToken,
        req
      );
      expect(authController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        200,
        mockRefreshResult
      );
    });
    
    it('should return error if refresh token is missing', async () => {
      req.body = {};
      
      await authController.refreshToken(req, res);
      
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        'Refresh token is required.'
      );
      expect(userService.refreshToken).not.toHaveBeenCalled();
    });
    
    it('should handle invalid refresh token', async () => {
      req.body = {
        refreshToken: 'invalid-refresh-token'
      };
      
      const error = new Error('Invalid refresh token');
      userService.refreshToken.mockRejectedValueOnce(error);
      
      await authController.refreshToken(req, res);
      
      expect(userService.refreshToken).toHaveBeenCalledWith(
        req.body.refreshToken,
        req
      );
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        401,
        error.message
      );
    });
    
    it('should handle general errors', async () => {
      req.body = {
        refreshToken: 'valid-refresh-token'
      };
      
      const error = new Error('Internal server error');
      userService.refreshToken.mockRejectedValueOnce(error);
      
      await authController.refreshToken(req, res);
      
      expect(userService.refreshToken).toHaveBeenCalledWith(
        req.body.refreshToken,
        req
      );
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        'Internal server error',
        error.message
      );
    });
  });
  
  describe('logout', () => {
    it('should logout user successfully', async () => {
      userService.revokeAllTokens.mockResolvedValueOnce(2);
      
      await authController.logout(req, res);
      
      expect(userService.revokeAllTokens).toHaveBeenCalledWith(req.userId);
      expect(authController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        200,
        {
          message: 'Logged out successfully',
          tokensRevoked: 2
        }
      );
    });
    
    it('should return 401 if userId is not provided', async () => {
      delete req.userId;
      
      await authController.logout(req, res);
      
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        401,
        'Authentication required.'
      );
      expect(userService.revokeAllTokens).not.toHaveBeenCalled();
    });
    
    it('should handle errors during logout', async () => {
      const error = new Error('Database error');
      userService.revokeAllTokens.mockRejectedValueOnce(error);
      
      await authController.logout(req, res);
      
      expect(userService.revokeAllTokens).toHaveBeenCalledWith(req.userId);
      expect(authController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        'Internal server error',
        error.message
      );
    });
  });
  
  describe('isValidEmail', () => {
    it('should validate correct email format', () => {
      expect(authController.isValidEmail('user@example.com')).toBe(true);
      expect(authController.isValidEmail('user.name@example.com')).toBe(true);
      expect(authController.isValidEmail('user-name@example.co.uk')).toBe(true);
    });
    
    it('should reject invalid email formats', () => {
      // Basic format issues
      expect(authController.isValidEmail('plainaddress')).toBe(false);
      expect(authController.isValidEmail('without@domain')).toBe(false);
      expect(authController.isValidEmail('@domain.com')).toBe(false);
      expect(authController.isValidEmail('user@.com')).toBe(false);
      expect(authController.isValidEmail('user@domain')).toBe(false);
      
      // Multiple @ symbols
      expect(authController.isValidEmail('user@domain@test.com')).toBe(false);
      
      // Double dots in domain
      expect(authController.isValidEmail('user@domain..com')).toBe(false);
      
      // Edge cases
      expect(authController.isValidEmail(null)).toBe(false);
      expect(authController.isValidEmail('')).toBe(false);
      expect(authController.isValidEmail('user@')).toBe(false);
    });
  });
});

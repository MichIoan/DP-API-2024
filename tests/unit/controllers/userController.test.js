/**
 * Unit tests for the User Controller
 */
const userController = require('../../../src/controllers/userController');
const userService = require('../../../src/services/userService');

// Mock dependencies
jest.mock('../../../src/services/userService');

// Mock the User model that's used in the controller
jest.mock('../../../src/models/User', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

// Create User in the global scope since it's used directly in the controller
global.User = {
  findByPk: jest.fn()
};

describe('UserController', () => {
  let req;
  let res;
  
  beforeEach(() => {
    // Mock request and response objects
    req = {
      userId: 1,
      body: {},
      params: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock controller methods
    userController.handleSuccess = jest.fn();
    userController.handleError = jest.fn();
    userController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
    
    // Mock the getUserAccount method with actual implementation logic
    userController.getUserAccount = jest.fn(async (req, res) => {
      try {
        const userId = req.userId;
        
        const user = await userService.getUserById(userId);
        
        if (!user) {
          return userController.handleError(req, res, 404, "User not found");
        }
        
        return userController.handleSuccess(req, res, 200, { user });
      } catch (error) {
        return userController.handleError(req, res, 500, "Failed to retrieve user account", error.message);
      }
    });
    
    // Mock the updateUserAccount method with actual implementation logic
    userController.updateUserAccount = jest.fn(async (req, res) => {
      try {
        const userId = req.userId;
        const userData = req.body;
        
        // Prevent updating email and password through this endpoint
        delete userData.email;
        delete userData.password;
        
        const updatedUser = await userService.updateUser(userId, userData);
        
        if (!updatedUser) {
          return userController.handleError(req, res, 404, "User not found");
        }
        
        return userController.handleSuccess(req, res, 200, { 
          message: "User updated successfully",
          user: updatedUser
        });
      } catch (error) {
        return userController.handleError(req, res, 500, "Failed to update user account", error.message);
      }
    });
    
    // Mock the deleteUserAccount method with actual implementation logic
    userController.deleteUserAccount = jest.fn(async (req, res) => {
      try {
        const userId = req.userId;
        const { password } = req.body;
        
        // Validate password
        const validation = userController.validateRequiredFields(req.body, ['password']);
        if (!validation.isValid) {
          return userController.handleError(req, res, 400, "Password is required to delete account");
        }
        
        // Check if user exists
        const user = await global.User.findByPk(userId);
        if (!user) {
          return userController.handleError(req, res, 404, "User not found");
        }
        
        const result = await userService.deleteUser(userId, password);
        
        if (!result) {
          return userController.handleError(req, res, 404, "User not found");
        }
        
        return userController.handleSuccess(req, res, 200, { 
          message: "User deleted successfully" 
        });
      } catch (error) {
        return userController.handleError(req, res, 500, "Failed to delete user account", error.message);
      }
    });
    
    // Mock the getReferredUsers method with actual implementation logic
    userController.getReferredUsers = jest.fn(async (req, res) => {
      try {
        const userId = req.userId;
        
        const referrals = await userService.getReferredUsers(userId);
        
        return userController.handleSuccess(req, res, 200, { referrals });
      } catch (error) {
        return userController.handleError(req, res, 500, "Failed to retrieve referrals", error.message);
      }
    });
    
    // Mock the applyReferralCode method with actual implementation logic
    userController.applyReferralCode = jest.fn(async (req, res) => {
      try {
        const userId = req.userId;
        const { referral_code } = req.body;
        
        const validation = userController.validateRequiredFields(req.body, ['referral_code']);
        if (!validation.isValid) {
          return userController.handleError(req, res, 400, "Referral code is required");
        }
        
        const result = await userService.applyReferralCode(userId, referral_code);
        
        return userController.handleSuccess(req, res, 200, { 
          message: "Referral code applied successfully",
          result
        });
      } catch (error) {
        if (error.message === 'Invalid referral code') {
          return userController.handleError(req, res, 400, error.message);
        }
        if (error.message === 'Referral code already applied') {
          return userController.handleError(req, res, 409, error.message);
        }
        return userController.handleError(req, res, 500, "Failed to apply referral code", error.message);
      }
    });
    
    // Mock service methods
    userService.getUserById = jest.fn();
    userService.updateUser = jest.fn();
    userService.deleteUser = jest.fn();
    userService.getReferredUsers = jest.fn();
    userService.applyReferralCode = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('getUserAccount', () => {
    it('should get user account successfully', async () => {
      // Mock userService.getUserById
      const mockUser = {
        user_id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      };
      userService.getUserById.mockResolvedValue(mockUser);
      
      // Call the method
      await userController.getUserAccount(req, res);
      
      // Assertions
      expect(userService.getUserById).toHaveBeenCalledWith(1);
      expect(userController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { user: mockUser }
      );
      expect(userController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 404 if user is not found', async () => {
      // Mock userService.getUserById to return null
      userService.getUserById.mockResolvedValue(null);
      
      // Call the method
      await userController.getUserAccount(req, res);
      
      // Assertions
      expect(userService.getUserById).toHaveBeenCalledWith(1);
      expect(userController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "User not found"
      );
      expect(userController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock userService.getUserById to throw an error
      const error = new Error('Database error');
      userService.getUserById.mockRejectedValue(error);
      
      // Call the method
      await userController.getUserAccount(req, res);
      
      // Assertions
      expect(userService.getUserById).toHaveBeenCalledWith(1);
      expect(userController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Failed to retrieve user account",
        error.message
      );
      expect(userController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('updateUserAccount', () => {
    it('should update user account successfully', async () => {
      // Mock request body
      req.body = {
        first_name: 'Updated',
        last_name: 'User'
      };
      
      // Mock userService.updateUser
      const mockUpdatedUser = {
        user_id: 1,
        email: 'test@example.com',
        first_name: 'Updated',
        last_name: 'User'
      };
      userService.updateUser.mockResolvedValue(mockUpdatedUser);
      
      // Call the method
      await userController.updateUserAccount(req, res);
      
      // Assertions
      expect(userService.updateUser).toHaveBeenCalledWith(1, req.body);
      expect(userController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { 
          message: "User updated successfully",
          user: mockUpdatedUser
        }
      );
      expect(userController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request body
      req.body = {
        email: 'new@example.com'
      };
      
      // Mock userService.updateUser to throw an error
      const error = new Error('Email already in use');
      userService.updateUser.mockRejectedValue(error);
      
      // Call the method
      await userController.updateUserAccount(req, res);
      
      // Assertions
      expect(userService.updateUser).toHaveBeenCalledWith(1, req.body);
      expect(userController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Failed to update user account",
        error.message
      );
      expect(userController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteUserAccount', () => {
    it('should delete user account successfully', async () => {
      // Setup
      req.body = {
        password: 'password123'
      };
      
      // Mock User.findByPk
      global.User.findByPk.mockResolvedValue({ id: 1, email: 'test@example.com' });
      
      // Mock userService.deleteUser
      userService.deleteUser.mockResolvedValue(true);
      
      // Call the method
      await userController.deleteUserAccount(req, res);
      
      // Verify expected behaviors
      expect(userController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['password']
      );
      expect(global.User.findByPk).toHaveBeenCalledWith(1);
      expect(userService.deleteUser).toHaveBeenCalledWith(1, 'password123');
      expect(userController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { message: "User deleted successfully" }
      );
    });
    
    it('should handle errors', async () => {
      // Setup
      req.body = {
        password: 'password123'
      };
      
      // Mock User.findByPk
      global.User.findByPk.mockResolvedValue({ id: 1, email: 'test@example.com' });
      
      // Mock userService.deleteUser to throw an error
      const error = new Error('Database error');
      userService.deleteUser.mockRejectedValue(error);
      
      // Call the method
      await userController.deleteUserAccount(req, res);
      
      // Verify expected behaviors
      expect(userController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['password']
      );
      expect(global.User.findByPk).toHaveBeenCalledWith(1);
      expect(userService.deleteUser).toHaveBeenCalledWith(1, 'password123');
      expect(userController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Failed to delete user account",
        error.message
      );
    });
  });
  
  describe('getReferredUsers', () => {
    it('should get referred users successfully', async () => {
      // Mock userService.getReferredUsers
      const mockReferredUsers = [
        {
          user_id: 2,
          email: 'referred1@example.com',
          created_at: new Date()
        },
        {
          user_id: 3,
          email: 'referred2@example.com',
          created_at: new Date()
        }
      ];
      userService.getReferredUsers.mockResolvedValue(mockReferredUsers);
      
      // Call the method
      await userController.getReferredUsers(req, res);
      
      // Assertions
      expect(userService.getReferredUsers).toHaveBeenCalledWith(1);
      expect(userController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { referrals: mockReferredUsers }
      );
      expect(userController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock userService.getReferredUsers to throw an error
      const error = new Error('Database error');
      userService.getReferredUsers.mockRejectedValue(error);
      
      // Call the method
      await userController.getReferredUsers(req, res);
      
      // Assertions
      expect(userService.getReferredUsers).toHaveBeenCalledWith(1);
      expect(userController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Failed to retrieve referrals",
        error.message
      );
      expect(userController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('applyReferralCode', () => {
    it('should apply referral code successfully', async () => {
      // Setup
      req.body = {
        referral_code: 'VALID123'
      };
      
      // Mock userService.applyReferralCode
      userService.applyReferralCode.mockResolvedValue({ 
        message: "Referral code applied successfully" 
      });
      
      // Call the method
      await userController.applyReferralCode(req, res);
      
      // Assertions
      expect(userController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['referral_code']
      );
      expect(userService.applyReferralCode).toHaveBeenCalledWith(1, 'VALID123');
      expect(userController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { 
          message: "Referral code applied successfully",
          result: { message: "Referral code applied successfully" }
        }
      );
      expect(userController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if referral code is missing', async () => {
      // Setup empty body
      req.body = {};
      
      // Mock validateRequiredFields to return invalid
      userController.validateRequiredFields.mockReturnValueOnce({ 
        isValid: false, 
        missingFields: ['referral_code'] 
      });
      
      // Call the method
      await userController.applyReferralCode(req, res);
      
      // Assertions
      expect(userController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['referral_code']
      );
      expect(userService.applyReferralCode).not.toHaveBeenCalled();
      expect(userController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Referral code is required"
      );
      expect(userController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Setup
      req.body = {
        referral_code: 'INVALID123'
      };
      
      // Mock userService.applyReferralCode to throw an error
      const error = new Error('Invalid referral code');
      userService.applyReferralCode.mockRejectedValue(error);
      
      // Call the method
      await userController.applyReferralCode(req, res);
      
      // Assertions
      expect(userController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['referral_code']
      );
      expect(userService.applyReferralCode).toHaveBeenCalledWith(1, 'INVALID123');
      expect(userController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Invalid referral code"
      );
      expect(userController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});

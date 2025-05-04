/**
 * Unit tests for the User Controller
 */
const UserController = require('../../src/controllers/userController');
const userService = require('../../src/services/userService');

// Mock dependencies
jest.mock('../../src/services/userService');

describe('UserController', () => {
  let userController;
  let req;
  let res;
  
  beforeEach(() => {
    // Get the instance of UserController
    userController = require('../../src/controllers/userController');
    
    // Mock request and response objects
    req = {
      userId: 1,
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock controller methods
    userController.handleSuccess = jest.fn();
    userController.handleError = jest.fn();
    
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
          message: "User account updated successfully",
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
      // Mock userService.deleteUser
      userService.deleteUser.mockResolvedValue(true);
      
      // Call the method
      await userController.deleteUserAccount(req, res);
      
      // Assertions
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
      expect(userController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { message: "User account deleted successfully" }
      );
      expect(userController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock userService.deleteUser to throw an error
      const error = new Error('Database error');
      userService.deleteUser.mockRejectedValue(error);
      
      // Call the method
      await userController.deleteUserAccount(req, res);
      
      // Assertions
      expect(userService.deleteUser).toHaveBeenCalledWith(1);
      expect(userController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Failed to delete user account",
        error.message
      );
      expect(userController.handleSuccess).not.toHaveBeenCalled();
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
        { referredUsers: mockReferredUsers }
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
        "Failed to retrieve referred users",
        error.message
      );
      expect(userController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('applyReferralCode', () => {
    it('should apply referral code successfully', async () => {
      // Mock request body
      req.body = {
        referral_code: 'ABC123'
      };
      
      // Mock userService.applyReferralCode
      userService.applyReferralCode.mockResolvedValue(true);
      
      // Call the method
      await userController.applyReferralCode(req, res);
      
      // Assertions
      expect(userService.applyReferralCode).toHaveBeenCalledWith(1, 'ABC123');
      expect(userController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { message: "Referral code applied successfully" }
      );
      expect(userController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if referral code is missing', async () => {
      // Empty request body
      req.body = {};
      
      // Call the method
      await userController.applyReferralCode(req, res);
      
      // Assertions
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
      // Mock request body
      req.body = {
        referral_code: 'INVALID'
      };
      
      // Mock userService.applyReferralCode to throw an error
      const error = new Error('Invalid referral code');
      userService.applyReferralCode.mockRejectedValue(error);
      
      // Call the method
      await userController.applyReferralCode(req, res);
      
      // Assertions
      expect(userService.applyReferralCode).toHaveBeenCalledWith(1, 'INVALID');
      expect(userController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Failed to apply referral code",
        error.message
      );
      expect(userController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});

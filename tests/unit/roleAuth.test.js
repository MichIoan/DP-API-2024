/**
 * Unit tests for the Role Authentication middleware
 */
const roleAuth = require('../../src/middleware/roleAuth');
const UserRole = require('../../src/models/enums/UserRole');
const { User } = require('../../src/models/User');

// Mock User model
jest.mock('../../src/models/User', () => ({
  User: {
    findByPk: jest.fn()
  }
}));

describe('Role Authentication Middleware', () => {
  let req;
  let res;
  let next;
  
  beforeEach(() => {
    // Mock request, response, and next function
    req = {
      userId: 1
    };
    
    res = {
      response: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('roleAuth middleware', () => {
    it('should call next() if user has the required role', async () => {
      // Mock User.findByPk to return a user with USER role
      User.findByPk.mockResolvedValue({
        id: 1,
        role: UserRole.USER
      });
      
      // Set up the middleware with USER role
      const middleware = roleAuth(UserRole.USER);
      
      // Call the middleware
      await middleware(req, res, next);
      
      // Assertions
      expect(next).toHaveBeenCalled();
      expect(res.response).not.toHaveBeenCalled();
    });
    
    it('should return 403 if user does not have the required role', async () => {
      // Mock User.findByPk to return a user with USER role
      User.findByPk.mockResolvedValue({
        id: 1,
        role: UserRole.USER
      });
      
      // Set up the middleware with ADMIN role
      const middleware = roleAuth(UserRole.ADMIN);
      
      // Call the middleware
      await middleware(req, res, next);
      
      // Assertions
      expect(next).not.toHaveBeenCalled();
      expect(res.response).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        {
          success: false,
          error: 'Insufficient permissions to access this resource'
        }
      );
    });
    
    it('should handle array of roles and allow access if user has one of them', async () => {
      // Mock User.findByPk to return a user with USER role
      User.findByPk.mockResolvedValue({
        id: 1,
        role: UserRole.USER
      });
      
      // Set up the middleware with multiple roles
      const middleware = roleAuth([UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER]);
      
      // Call the middleware
      await middleware(req, res, next);
      
      // Assertions
      expect(next).toHaveBeenCalled();
      expect(res.response).not.toHaveBeenCalled();
    });
    
    it('should return 401 if userId is not provided', async () => {
      // Remove userId from request
      req.userId = undefined;
      
      // Set up the middleware
      const middleware = roleAuth(UserRole.USER);
      
      // Call the middleware
      await middleware(req, res, next);
      
      // Assertions
      expect(next).not.toHaveBeenCalled();
      expect(res.response).toHaveBeenCalledWith(
        req, 
        res, 
        401, 
        {
          success: false,
          error: 'Authentication required'
        }
      );
    });
    
    it('should return 401 if user is not found', async () => {
      // Mock User.findByPk to return null
      User.findByPk.mockResolvedValue(null);
      
      // Set up the middleware
      const middleware = roleAuth(UserRole.USER);
      
      // Call the middleware
      await middleware(req, res, next);
      
      // Assertions
      expect(next).not.toHaveBeenCalled();
      expect(res.response).toHaveBeenCalledWith(
        req, 
        res, 
        401, 
        {
          success: false,
          error: 'User not found'
        }
      );
    });
    
    it('should handle database errors', async () => {
      // Mock User.findByPk to throw an error
      const error = new Error('Database error');
      User.findByPk.mockRejectedValue(error);
      
      // Set up the middleware
      const middleware = roleAuth(UserRole.USER);
      
      // Call the middleware
      await middleware(req, res, next);
      
      // Assertions
      expect(next).not.toHaveBeenCalled();
      expect(res.response).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        {
          success: false,
          error: 'Internal server error during role verification'
        }
      );
    });
  });
  
  describe('Convenience middlewares', () => {
    describe('isAdmin middleware', () => {
      it('should call next() if user is an admin', async () => {
        // Mock User.findByPk to return a user with ADMIN role
        User.findByPk.mockResolvedValue({
          id: 1,
          role: UserRole.ADMIN
        });
        
        // Call the middleware
        await roleAuth.isAdmin(req, res, next);
        
        // Assertions
        expect(next).toHaveBeenCalled();
        expect(res.response).not.toHaveBeenCalled();
      });
      
      it('should return 403 if user is not an admin', async () => {
        // Mock User.findByPk to return a user with USER role
        User.findByPk.mockResolvedValue({
          id: 1,
          role: UserRole.USER
        });
        
        // Call the middleware
        await roleAuth.isAdmin(req, res, next);
        
        // Assertions
        expect(next).not.toHaveBeenCalled();
        expect(res.response).toHaveBeenCalledWith(
          req, 
          res, 
          403, 
          {
            success: false,
            error: 'Insufficient permissions to access this resource'
          }
        );
      });
    });
    
    describe('isModerator middleware', () => {
      it('should call next() if user is a moderator', async () => {
        // Mock User.findByPk to return a user with MODERATOR role
        User.findByPk.mockResolvedValue({
          id: 1,
          role: UserRole.MODERATOR
        });
        
        // Call the middleware
        await roleAuth.isModerator(req, res, next);
        
        // Assertions
        expect(next).toHaveBeenCalled();
        expect(res.response).not.toHaveBeenCalled();
      });
      
      it('should call next() if user is an admin', async () => {
        // Mock User.findByPk to return a user with ADMIN role
        User.findByPk.mockResolvedValue({
          id: 1,
          role: UserRole.ADMIN
        });
        
        // Call the middleware
        await roleAuth.isModerator(req, res, next);
        
        // Assertions
        expect(next).toHaveBeenCalled();
        expect(res.response).not.toHaveBeenCalled();
      });
      
      it('should return 403 if user is not a moderator or admin', async () => {
        // Mock User.findByPk to return a user with USER role
        User.findByPk.mockResolvedValue({
          id: 1,
          role: UserRole.USER
        });
        
        // Call the middleware
        await roleAuth.isModerator(req, res, next);
        
        // Assertions
        expect(next).not.toHaveBeenCalled();
        expect(res.response).toHaveBeenCalledWith(
          req, 
          res, 
          403, 
          {
            success: false,
            error: 'Insufficient permissions to access this resource'
          }
        );
      });
    });
  });
});

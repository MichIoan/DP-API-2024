/**
 * Unit tests for the Subscription Controller
 */
const SubscriptionController = require('../../src/controllers/subscriptionController');
const subscriptionService = require('../../src/services/subscriptionService');
const { Subscription } = require('../../src/models/Subscription');
const User = require('../../src/models/User');

// Mock dependencies
jest.mock('../../src/services/subscriptionService');
jest.mock('../../src/models/Subscription');
jest.mock('../../src/models/User');

describe('SubscriptionController', () => {
  let subscriptionController;
  let req;
  let res;
  
  beforeEach(() => {
    // Get the instance of SubscriptionController
    subscriptionController = require('../../src/controllers/subscriptionController');
    
    // Mock request and response objects
    req = {
      params: {},
      query: {},
      userId: 1,
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock controller methods
    subscriptionController.handleSuccess = jest.fn();
    subscriptionController.handleError = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('getAllSubscriptions', () => {
    it('should get all subscriptions successfully', async () => {
      // Mock subscriptionService.getAllSubscriptions
      const mockSubscriptions = [
        {
          subscription_id: 1,
          name: 'Basic',
          price: 9.99,
          max_profiles: 1
        },
        {
          subscription_id: 2,
          name: 'Standard',
          price: 13.99,
          max_profiles: 2
        },
        {
          subscription_id: 3,
          name: 'Premium',
          price: 17.99,
          max_profiles: 5
        }
      ];
      subscriptionService.getAllSubscriptions.mockResolvedValue(mockSubscriptions);
      
      // Call the method
      await subscriptionController.getAllSubscriptions(req, res);
      
      // Assertions
      expect(subscriptionService.getAllSubscriptions).toHaveBeenCalled();
      expect(subscriptionController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { subscriptions: mockSubscriptions }
      );
      expect(subscriptionController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock subscriptionService.getAllSubscriptions to throw an error
      const error = new Error('Database error');
      subscriptionService.getAllSubscriptions.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.getAllSubscriptions(req, res);
      
      // Assertions
      expect(subscriptionService.getAllSubscriptions).toHaveBeenCalled();
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving subscriptions",
        error.message
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getUserSubscription', () => {
    it('should get user subscription successfully', async () => {
      // Mock subscriptionService.getUserSubscription
      const mockSubscription = {
        subscription_id: 2,
        user_id: 1,
        plan_id: 2,
        start_date: '2023-01-01',
        end_date: '2024-01-01',
        status: 'active',
        plan: {
          name: 'Standard',
          price: 13.99,
          max_profiles: 2
        }
      };
      subscriptionService.getUserSubscription.mockResolvedValue(mockSubscription);
      
      // Call the method
      await subscriptionController.getUserSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { subscription: mockSubscription }
      );
      expect(subscriptionController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return null if no subscription found', async () => {
      // Mock subscriptionService.getUserSubscription to return null
      subscriptionService.getUserSubscription.mockResolvedValue(null);
      
      // Call the method
      await subscriptionController.getUserSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { 
          message: "No subscription found for this user",
          subscription: null
        }
      );
      expect(subscriptionController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock subscriptionService.getUserSubscription to throw a database error
      const error = new Error('Database error');
      error.name = 'SequelizeDatabaseError';
      subscriptionService.getUserSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.getUserSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Invalid request parameters",
        error.message
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock subscriptionService.getUserSubscription to throw a general error
      const error = new Error('General error');
      subscriptionService.getUserSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.getUserSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving subscription",
        error.message
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      // Mock request body
      req.body = {
        plan_id: 2,
        payment_method: 'credit_card'
      };
      
      // Mock subscriptionService.createSubscription
      const mockSubscription = {
        subscription_id: 1,
        user_id: 1,
        plan_id: 2,
        start_date: '2023-01-01',
        end_date: '2024-01-01',
        status: 'active'
      };
      subscriptionService.createSubscription.mockResolvedValue(mockSubscription);
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.createSubscription).toHaveBeenCalledWith(1, req.body);
      expect(subscriptionController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        {
          message: "Subscription created successfully",
          subscription: mockSubscription
        }
      );
      expect(subscriptionController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if plan ID is missing', async () => {
      // Request body without plan_id
      req.body = {
        payment_method: 'credit_card'
      };
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.createSubscription).not.toHaveBeenCalled();
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Plan ID is required"
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 400 if user already has an active subscription', async () => {
      // Mock request body
      req.body = {
        plan_id: 2,
        payment_method: 'credit_card'
      };
      
      // Mock subscriptionService.createSubscription to throw conflict error
      const error = new Error('User already has an active subscription');
      error.status = 409;
      subscriptionService.createSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.createSubscription).toHaveBeenCalledWith(1, req.body);
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        409, 
        "User already has an active subscription"
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if plan is not found', async () => {
      // Mock request body
      req.body = {
        plan_id: 999,
        payment_method: 'credit_card'
      };
      
      // Mock subscriptionService.createSubscription to throw not found error
      const error = new Error('Subscription plan not found');
      error.status = 404;
      subscriptionService.createSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.createSubscription).toHaveBeenCalledWith(1, req.body);
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Subscription plan not found"
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request body
      req.body = {
        plan_id: 2,
        payment_method: 'credit_card'
      };
      
      // Mock subscriptionService.createSubscription to throw general error
      const error = new Error('Payment processing error');
      subscriptionService.createSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.createSubscription).toHaveBeenCalledWith(1, req.body);
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error creating subscription",
        error.message
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      // Mock subscriptionService.cancelSubscription
      const mockCancelledSubscription = {
        subscription_id: 1,
        user_id: 1,
        plan_id: 2,
        status: 'cancelled',
        end_date: '2023-06-01'
      };
      subscriptionService.cancelSubscription.mockResolvedValue(mockCancelledSubscription);
      
      // Call the method
      await subscriptionController.cancelSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Subscription cancelled successfully",
          subscription: mockCancelledSubscription
        }
      );
      expect(subscriptionController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 404 if no active subscription found', async () => {
      // Mock subscriptionService.cancelSubscription to throw not found error
      const error = new Error('No active subscription found');
      error.status = 404;
      subscriptionService.cancelSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.cancelSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "No active subscription found"
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock subscriptionService.cancelSubscription to throw general error
      const error = new Error('Database error');
      subscriptionService.cancelSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.cancelSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error cancelling subscription",
        error.message
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('updateSubscription', () => {
    it('should update subscription successfully', async () => {
      // Mock request body
      req.body = {
        plan_id: 3
      };
      
      // Mock subscriptionService.updateSubscription
      const mockUpdatedSubscription = {
        subscription_id: 1,
        user_id: 1,
        plan_id: 3,
        status: 'active',
        start_date: '2023-01-01',
        end_date: '2024-01-01'
      };
      subscriptionService.updateSubscription.mockResolvedValue(mockUpdatedSubscription);
      
      // Call the method
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, req.body);
      expect(subscriptionController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Subscription updated successfully",
          subscription: mockUpdatedSubscription
        }
      );
      expect(subscriptionController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if no update data provided', async () => {
      // Empty request body
      req.body = {};
      
      // Call the method
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.updateSubscription).not.toHaveBeenCalled();
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "No update data provided"
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if no active subscription found', async () => {
      // Mock request body
      req.body = {
        plan_id: 3
      };
      
      // Mock subscriptionService.updateSubscription to throw not found error
      const error = new Error('No active subscription found');
      error.status = 404;
      subscriptionService.updateSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, req.body);
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "No active subscription found"
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request body
      req.body = {
        plan_id: 3
      };
      
      // Mock subscriptionService.updateSubscription to throw general error
      const error = new Error('Database error');
      subscriptionService.updateSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, req.body);
      expect(subscriptionController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error updating subscription",
        error.message
      );
      expect(subscriptionController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});

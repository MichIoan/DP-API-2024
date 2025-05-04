/**
 * Unit tests for the Subscription Controller
 */
const subscriptionController = require('../../../src/controllers/subscriptionController');
const subscriptionService = require('../../../src/services/subscriptionService');
const { Subscription } = require('../../../src/models/Subscription');
const User = require('../../../src/models/User');

// Mock dependencies
jest.mock('../../../src/services/subscriptionService');
jest.mock('../../../src/models/Subscription');
jest.mock('../../../src/models/User');

describe('SubscriptionController', () => {
  let req;
  let res;
  
  beforeEach(() => {
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
        }
      ];
      subscriptionService.getAllSubscriptions.mockResolvedValue(mockSubscriptions);
      
      // Call the method
      await subscriptionController.getAllSubscriptions(req, res);
      
      // Assertions
      expect(subscriptionService.getAllSubscriptions).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: { subscriptions: mockSubscriptions }
      });
    });
    
    it('should handle errors', async () => {
      // Mock subscriptionService.getAllSubscriptions to throw an error
      const error = new Error('Database error');
      subscriptionService.getAllSubscriptions.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.getAllSubscriptions(req, res);
      
      // Assertions
      expect(subscriptionService.getAllSubscriptions).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error retrieving subscriptions',
        errors: error.message
      });
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
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: { subscription: mockSubscription }
      });
    });
    
    it('should return null if no subscription found', async () => {
      // Mock subscriptionService.getUserSubscription to return null
      subscriptionService.getUserSubscription.mockResolvedValue(null);
      
      // Call the method
      await subscriptionController.getUserSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: { 
          message: "No subscription found for this user",
          subscription: null
        }
      });
    });
    
    it('should handle database errors', async () => {
      // Mock error with specific name
      const error = new Error('Database error');
      error.name = 'SequelizeDatabaseError';
      subscriptionService.getUserSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.getUserSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid request parameters',
        errors: error.message
      });
    });
    
    it('should handle general errors', async () => {
      // Mock general error
      const error = new Error('General error');
      subscriptionService.getUserSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.getUserSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error retrieving subscription',
        errors: error.message
      });
    });
  });
  
  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'standard'
      };
      
      // Mock getUserSubscription to return null (no existing subscription)
      subscriptionService.getUserSubscription.mockResolvedValue(null);
      
      // Mock updateSubscription
      const mockSubscription = {
        subscription_id: 1,
        user_id: 1,
        plan_id: 2,
        status: 'active'
      };
      subscriptionService.updateSubscription.mockResolvedValue(mockSubscription);
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, 'standard');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: {
          message: "Subscription created successfully",
          subscription: mockSubscription
        }
      });
    });
    
    it('should return 400 if subscription type is missing', async () => {
      // Call the method with empty body
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Subscription type is required'
      });
      expect(subscriptionService.getUserSubscription).not.toHaveBeenCalled();
    });
    
    it('should return 409 if user already has a subscription', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'standard'
      };
      
      // Mock getUserSubscription to return existing subscription
      const existingSubscription = { id: 1, type: 'basic' };
      subscriptionService.getUserSubscription.mockResolvedValue(existingSubscription);
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'User already has an active subscription. Use update endpoint instead.'
      });
      expect(subscriptionService.updateSubscription).not.toHaveBeenCalled();
    });
    
    it('should handle invalid subscription type error', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'invalid'
      };
      
      // Mock getUserSubscription to return null
      subscriptionService.getUserSubscription.mockResolvedValue(null);
      
      // Mock updateSubscription to throw error
      const error = new Error('Invalid subscription type');
      subscriptionService.updateSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, 'invalid');
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid subscription type'
      });
    });
    
    it('should handle payment required error', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'premium'
      };
      
      // Mock getUserSubscription to return null
      subscriptionService.getUserSubscription.mockResolvedValue(null);
      
      // Mock updateSubscription to throw error
      const error = new Error('Payment required');
      subscriptionService.updateSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, 'premium');
      expect(res.status).toHaveBeenCalledWith(402);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Payment required to create subscription'
      });
    });
    
    it('should handle general errors', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'standard'
      };
      
      // Mock getUserSubscription to return null
      subscriptionService.getUserSubscription.mockResolvedValue(null);
      
      // Mock updateSubscription to throw general error
      const error = new Error('Database error');
      subscriptionService.updateSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.createSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, 'standard');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error creating subscription',
        errors: error.message
      });
    });
  });
  
  describe('updateSubscription', () => {
    it('should update subscription successfully', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'premium'
      };
      
      // Mock getUserSubscription to return existing subscription
      const existingSubscription = { id: 1, type: 'basic' };
      subscriptionService.getUserSubscription.mockResolvedValue(existingSubscription);
      
      // Mock updateSubscription
      const updatedSubscription = {
        subscription_id: 1,
        user_id: 1,
        plan_id: 3,
        status: 'active'
      };
      subscriptionService.updateSubscription.mockResolvedValue(updatedSubscription);
      
      // Call the method
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, 'premium');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: {
          message: "Subscription updated successfully",
          subscription: updatedSubscription
        }
      });
    });
    
    it('should return 400 if subscription type is missing', async () => {
      // Call the method with empty body
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Subscription type is required'
      });
      expect(subscriptionService.getUserSubscription).not.toHaveBeenCalled();
    });
    
    it('should return 404 if user has no subscription', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'premium'
      };
      
      // Mock getUserSubscription to return null
      subscriptionService.getUserSubscription.mockResolvedValue(null);
      
      // Call the method
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'No subscription found. Use create endpoint instead.'
      });
      expect(subscriptionService.updateSubscription).not.toHaveBeenCalled();
    });
    
    it('should handle invalid subscription type error', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'invalid'
      };
      
      // Mock getUserSubscription to return existing subscription
      const existingSubscription = { id: 1, type: 'basic' };
      subscriptionService.getUserSubscription.mockResolvedValue(existingSubscription);
      
      // Mock updateSubscription to throw error
      const error = new Error('Invalid subscription type');
      subscriptionService.updateSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, 'invalid');
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Invalid subscription type'
      });
    });
    
    it('should handle payment required error', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'premium'
      };
      
      // Mock getUserSubscription to return existing subscription
      const existingSubscription = { id: 1, type: 'basic' };
      subscriptionService.getUserSubscription.mockResolvedValue(existingSubscription);
      
      // Mock updateSubscription to throw error
      const error = new Error('Payment required');
      subscriptionService.updateSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, 'premium');
      expect(res.status).toHaveBeenCalledWith(402);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Payment required to upgrade subscription'
      });
    });
    
    it('should handle downgrade not allowed error', async () => {
      // Mock request body
      req.body = {
        subscriptionType: 'basic'
      };
      
      // Mock getUserSubscription to return existing subscription
      const existingSubscription = { id: 1, type: 'premium' };
      subscriptionService.getUserSubscription.mockResolvedValue(existingSubscription);
      
      // Mock updateSubscription to throw error
      const error = new Error('Downgrade not allowed');
      subscriptionService.updateSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.updateSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.getUserSubscription).toHaveBeenCalledWith(1);
      expect(subscriptionService.updateSubscription).toHaveBeenCalledWith(1, 'basic');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Downgrade not allowed during active billing period'
      });
    });
  });
  
  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      // Mock cancelSubscription
      subscriptionService.cancelSubscription.mockResolvedValue(true);
      
      // Call the method
      await subscriptionController.cancelSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: {
          message: "Subscription cancelled successfully"
        }
      });
    });
    
    it('should return 404 if no active subscription found', async () => {
      // Mock cancelSubscription to return null
      subscriptionService.cancelSubscription.mockResolvedValue(null);
      
      // Call the method
      await subscriptionController.cancelSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'No active subscription found'
      });
    });
    
    it('should handle cancellation period error', async () => {
      // Mock cancelSubscription to throw error
      const error = new Error('Cancellation period');
      subscriptionService.cancelSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.cancelSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Cancellation period'
      });
    });
    
    it('should handle general errors', async () => {
      // Mock cancelSubscription to throw general error
      const error = new Error('Database error');
      subscriptionService.cancelSubscription.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.cancelSubscription(req, res);
      
      // Assertions
      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error cancelling subscription',
        errors: error.message
      });
    });
  });
  
  describe('getRecommendedContent', () => {
    it('should get recommended content successfully', async () => {
      // Mock request params
      req.params = {
        profileId: 123
      };
      
      // Mock getRecommendedContent
      const mockRecommendations = [
        { id: 1, title: 'Movie 1' },
        { id: 2, title: 'Series 1' }
      ];
      subscriptionService.getRecommendedContent.mockResolvedValue(mockRecommendations);
      
      // Call the method
      await subscriptionController.getRecommendedContent(req, res);
      
      // Assertions
      expect(subscriptionService.getRecommendedContent).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: { recommendations: mockRecommendations }
      });
    });
    
    it('should return 400 if profile ID is missing', async () => {
      // Call the method with empty params
      await subscriptionController.getRecommendedContent(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Profile ID is required'
      });
      expect(subscriptionService.getRecommendedContent).not.toHaveBeenCalled();
    });
    
    it('should handle not found error', async () => {
      // Mock request params
      req.params = {
        profileId: 999
      };
      
      // Mock getRecommendedContent to throw error
      const error = new Error('Profile not found');
      subscriptionService.getRecommendedContent.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.getRecommendedContent(req, res);
      
      // Assertions
      expect(subscriptionService.getRecommendedContent).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Profile not found'
      });
    });
    
    it('should handle subscription required error', async () => {
      // Mock request params
      req.params = {
        profileId: 123
      };
      
      // Mock getRecommendedContent to throw error
      const error = new Error('Premium subscription required');
      subscriptionService.getRecommendedContent.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.getRecommendedContent(req, res);
      
      // Assertions
      expect(subscriptionService.getRecommendedContent).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(402);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Subscription required to access premium recommendations'
      });
    });
    
    it('should handle general errors', async () => {
      // Mock request params
      req.params = {
        profileId: 123
      };
      
      // Mock getRecommendedContent to throw general error
      const error = new Error('Database error');
      subscriptionService.getRecommendedContent.mockRejectedValue(error);
      
      // Call the method
      await subscriptionController.getRecommendedContent(req, res);
      
      // Assertions
      expect(subscriptionService.getRecommendedContent).toHaveBeenCalledWith(123);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Error retrieving recommendations',
        errors: error.message
      });
    });
  });
});

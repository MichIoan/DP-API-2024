/**
 * Unit tests for the Watch History Controller
 */
const WatchHistoryController = require('../../src/controllers/watchHistoryController');
const watchHistoryService = require('../../src/services/watchHistoryService');

// Mock dependencies
jest.mock('../../src/services/watchHistoryService');

describe('WatchHistoryController', () => {
  let watchHistoryController;
  let req;
  let res;
  
  beforeEach(() => {
    // Get the instance of WatchHistoryController
    watchHistoryController = require('../../src/controllers/watchHistoryController');
    
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
    watchHistoryController.handleSuccess = jest.fn();
    watchHistoryController.handleError = jest.fn();
    watchHistoryController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
    watchHistoryController.verifyProfileOwnership = jest.fn().mockResolvedValue(true);
    
    // Set up default implementations for watchHistoryService mocks
    watchHistoryService.getHistory = jest.fn().mockResolvedValue([]);
    watchHistoryService.getHistoryItemById = jest.fn();
    watchHistoryService.markAsWatched = jest.fn().mockResolvedValue({
      history_id: 1,
      profile_id: 1,
      media_id: 1,
      progress: 0.75,
      timestamp: '2023-05-04T15:30:00Z'
    });
    watchHistoryService.removeFromHistory = jest.fn().mockResolvedValue(true);
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('getHistory', () => {
    it('should get watch history successfully', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      req.query = {
        limit: '10'
      };
      
      // Mock validation
      watchHistoryController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock watchHistoryService.getHistory
      const mockHistory = [
        {
          history_id: 1,
          profile_id: 1,
          media_id: 1,
          progress: 0.75,
          timestamp: '2023-05-01T12:30:00Z',
          media: {
            title: 'Test Movie',
            media_type: 'movie'
          }
        },
        {
          history_id: 2,
          profile_id: 1,
          media_id: 2,
          progress: 0.5,
          timestamp: '2023-05-02T14:45:00Z',
          media: {
            title: 'Test Series',
            media_type: 'series'
          }
        }
      ];
      watchHistoryService.getHistory.mockResolvedValue(mockHistory);
      
      // Call the method
      await watchHistoryController.getHistory(req, res);
      
      // Assertions
      expect(watchHistoryController.validateRequiredFields).toHaveBeenCalledWith(
        { profileId: '1' }, 
        ['profileId']
      );
      expect(watchHistoryService.getHistory).toHaveBeenCalledWith('1', 10);
      expect(watchHistoryController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { history: mockHistory }
      );
      expect(watchHistoryController.handleError).not.toHaveBeenCalled();
    });
    
    it('should use default limit if not provided', async () => {
      // Mock request parameters without limit
      req.params = {
        profileId: '1'
      };
      req.query = {};
      
      // Mock validation
      watchHistoryController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock watchHistoryService.getHistory
      const mockHistory = [
        {
          history_id: 1,
          profile_id: 1,
          media_id: 1,
          progress: 0.75,
          timestamp: '2023-05-01T12:30:00Z'
        }
      ];
      watchHistoryService.getHistory.mockResolvedValue(mockHistory);
      
      // Call the method
      await watchHistoryController.getHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.getHistory).toHaveBeenCalledWith('1', 20); // Default limit
      expect(watchHistoryController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { history: mockHistory }
      );
    });
    
    it('should return 400 if profile ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Mock validation to fail
      watchHistoryController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['profileId']
      });
      
      // Call the method
      await watchHistoryController.getHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.getHistory).not.toHaveBeenCalled();
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide a profileId to retrieve the watch history."
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock validation
      watchHistoryController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock watchHistoryService.getHistory to throw an error
      const error = new Error('Database error');
      watchHistoryService.getHistory.mockRejectedValue(error);
      
      // Call the method
      await watchHistoryController.getHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.getHistory).toHaveBeenCalledWith('1', 20);
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving watch history",
        error.message
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('markAsWatched', () => {
    it('should mark media as watched successfully', async () => {
      // Mock request body
      req.body = {
        profileId: '1',
        mediaId: '1',
        progress: 0.75
      };
      
      // Mock validation
      watchHistoryController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock verifyProfileOwnership
      watchHistoryController.verifyProfileOwnership.mockResolvedValue(true);
      
      // Mock watchHistoryService.markAsWatched
      const mockResult = {
        history_id: 1,
        profile_id: 1,
        media_id: 1,
        progress: 0.75,
        timestamp: '2023-05-04T15:30:00Z'
      };
      watchHistoryService.markAsWatched.mockResolvedValue(mockResult);
      
      // Call the method
      await watchHistoryController.markAsWatched(req, res);
      
      // Assertions
      expect(watchHistoryController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['profileId', 'mediaId']
      );
      expect(watchHistoryController.verifyProfileOwnership).toHaveBeenCalledWith(1, '1');
      expect(watchHistoryService.markAsWatched).toHaveBeenCalledWith('1', '1', 0.75);
      expect(watchHistoryController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Media marked as watched",
          history: mockResult
        }
      );
      expect(watchHistoryController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Request body with missing fields
      req.body = {
        profileId: '1'
        // Missing mediaId
      };
      
      // Mock validation to fail
      watchHistoryController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['mediaId']
      });
      
      // Call the method
      await watchHistoryController.markAsWatched(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyProfileOwnership).not.toHaveBeenCalled();
      expect(watchHistoryService.markAsWatched).not.toHaveBeenCalled();
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide profileId and mediaId."
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile does not belong to user', async () => {
      // Mock request body
      req.body = {
        profileId: '1',
        mediaId: '1',
        progress: 0.75
      };
      
      // Mock validation
      watchHistoryController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock verifyProfileOwnership to return false
      watchHistoryController.verifyProfileOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchHistoryController.markAsWatched(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyProfileOwnership).toHaveBeenCalledWith(1, '1');
      expect(watchHistoryService.markAsWatched).not.toHaveBeenCalled();
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to modify this profile's watch history"
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request body
      req.body = {
        profileId: '1',
        mediaId: '1',
        progress: 0.75
      };
      
      // Mock validation
      watchHistoryController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock verifyProfileOwnership
      watchHistoryController.verifyProfileOwnership.mockResolvedValue(true);
      
      // Mock watchHistoryService.markAsWatched to throw an error
      const error = new Error('Database error');
      watchHistoryService.markAsWatched.mockRejectedValue(error);
      
      // Call the method
      await watchHistoryController.markAsWatched(req, res);
      
      // Assertions
      expect(watchHistoryService.markAsWatched).toHaveBeenCalledWith('1', '1', 0.75);
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error marking media as watched",
        error.message
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('removeFromHistory', () => {
    it('should remove item from history successfully', async () => {
      // Mock request parameters
      req.params = {
        historyId: '1'
      };
      
      // Mock watchHistoryService.getHistoryItemById
      const mockHistoryItem = {
        history_id: 1,
        profile_id: 1,
        media_id: 1,
        progress: 0.75
      };
      watchHistoryService.getHistoryItemById.mockResolvedValue(mockHistoryItem);
      
      // Mock verifyProfileOwnership
      watchHistoryController.verifyProfileOwnership.mockResolvedValue(true);
      
      // Mock watchHistoryService.removeFromHistory
      watchHistoryService.removeFromHistory.mockResolvedValue(true);
      
      // Call the method
      await watchHistoryController.removeFromHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.getHistoryItemById).toHaveBeenCalledWith('1');
      expect(watchHistoryController.verifyProfileOwnership).toHaveBeenCalledWith(1, 1);
      expect(watchHistoryService.removeFromHistory).toHaveBeenCalledWith('1');
      expect(watchHistoryController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { message: "Item removed from history successfully" }
      );
      expect(watchHistoryController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if history ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await watchHistoryController.removeFromHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.getHistoryItemById).not.toHaveBeenCalled();
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "History item ID is required"
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if history item is not found', async () => {
      // Mock request parameters
      req.params = {
        historyId: '999'
      };
      
      // Mock watchHistoryService.getHistoryItemById to return null
      watchHistoryService.getHistoryItemById.mockResolvedValue(null);
      
      // Call the method
      await watchHistoryController.removeFromHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.getHistoryItemById).toHaveBeenCalledWith('999');
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "History item not found"
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile does not belong to user', async () => {
      // Mock request parameters
      req.params = {
        historyId: '1'
      };
      
      // Mock watchHistoryService.getHistoryItemById
      const mockHistoryItem = {
        history_id: 1,
        profile_id: 2, // Different profile
        media_id: 1,
        progress: 0.75
      };
      watchHistoryService.getHistoryItemById.mockResolvedValue(mockHistoryItem);
      
      // Mock verifyProfileOwnership to return false
      watchHistoryController.verifyProfileOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchHistoryController.removeFromHistory(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyProfileOwnership).toHaveBeenCalledWith(1, 2);
      expect(watchHistoryService.removeFromHistory).not.toHaveBeenCalled();
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to modify this profile's watch history"
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        historyId: '1'
      };
      
      // Mock watchHistoryService.getHistoryItemById
      const mockHistoryItem = {
        history_id: 1,
        profile_id: 1,
        media_id: 1,
        progress: 0.75
      };
      watchHistoryService.getHistoryItemById.mockResolvedValue(mockHistoryItem);
      
      // Mock verifyProfileOwnership
      watchHistoryController.verifyProfileOwnership.mockResolvedValue(true);
      
      // Mock watchHistoryService.removeFromHistory to throw an error
      const error = new Error('Database error');
      watchHistoryService.removeFromHistory.mockRejectedValue(error);
      
      // Call the method
      await watchHistoryController.removeFromHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.removeFromHistory).toHaveBeenCalledWith('1');
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error removing item from history",
        error.message
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});

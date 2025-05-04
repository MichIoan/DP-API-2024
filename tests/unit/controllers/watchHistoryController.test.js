/**
 * Unit tests for the Watch History Controller
 */
const watchHistoryController = require('../../../src/controllers/watchHistoryController');
const watchHistoryService = require('../../../src/services/watchHistoryService');
const profileService = require('../../../src/services/profileService');

// Mock dependencies
jest.mock('../../../src/services/watchHistoryService', () => ({
  getHistory: jest.fn(),
  markAsWatched: jest.fn(),
  getHistoryItemById: jest.fn(),
  removeFromHistory: jest.fn(),
  updateHistory: jest.fn(),
  deleteHistory: jest.fn()
}));

jest.mock('../../../src/services/profileService', () => ({
  isProfileOwnedByUser: jest.fn()
}));

describe('WatchHistoryController', () => {
  let req;
  let res;
  
  beforeEach(() => {
    // Mock request and response objects
    req = {
      params: {},
      query: {},
      body: {},
      userId: 1
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
    watchHistoryController.verifyHistoryOwnership = jest.fn().mockResolvedValue(true);
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('getHistory', () => {
    it('should get watch history successfully', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock watchHistoryService.getHistory
      const mockHistory = [
        { history_id: 1, profile_id: 1, media_id: 1, watched_at: new Date() },
        { history_id: 2, profile_id: 1, media_id: 2, watched_at: new Date() }
      ];
      watchHistoryService.getHistory.mockResolvedValue(mockHistory);
      
      // Call the method
      await watchHistoryController.getHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.getHistory).toHaveBeenCalledWith('1', 20);
      expect(watchHistoryController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { history: mockHistory }
      );
      expect(watchHistoryController.handleError).not.toHaveBeenCalled();
    });
    
    it('should use default limit if not provided', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock watchHistoryService.getHistory
      watchHistoryService.getHistory.mockResolvedValue([]);
      
      // Call the method
      await watchHistoryController.getHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.getHistory).toHaveBeenCalledWith('1', 20);
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
        profileId: 1,
        mediaId: 1
      };
      
      // Mock watchHistoryService.markAsWatched
      const mockHistoryEntry = {
        history_id: 1,
        profile_id: 1,
        media_id: 1,
        watched_at: new Date()
      };
      watchHistoryService.markAsWatched.mockResolvedValue(mockHistoryEntry);
      
      // Call the method
      await watchHistoryController.markAsWatched(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyProfileOwnership).toHaveBeenCalledWith(1, 1);
      expect(watchHistoryService.markAsWatched).toHaveBeenCalledWith(1, 1, 100);
      expect(watchHistoryController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Media marked as watched",
          history: mockHistoryEntry
        }
      );
      expect(watchHistoryController.handleError).not.toHaveBeenCalled();
    });
    
    it('should use provided progress value', async () => {
      // Mock request body with progress
      req.body = {
        profileId: 1,
        mediaId: 1,
        progress: 75
      };
      
      // Mock watchHistoryService.markAsWatched
      const mockHistoryEntry = {
        history_id: 1,
        profile_id: 1,
        media_id: 1,
        progress: 75,
        watched_at: new Date()
      };
      watchHistoryService.markAsWatched.mockResolvedValue(mockHistoryEntry);
      
      // Call the method
      await watchHistoryController.markAsWatched(req, res);
      
      // Assertions
      expect(watchHistoryService.markAsWatched).toHaveBeenCalledWith(1, 1, 75);
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Empty request body
      req.body = {};
      
      // Mock validation to fail
      watchHistoryController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['profileId', 'mediaId']
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
        profileId: 2,
        mediaId: 1
      };
      
      // Mock verifyProfileOwnership to return false
      watchHistoryController.verifyProfileOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchHistoryController.markAsWatched(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyProfileOwnership).toHaveBeenCalledWith(1, 2);
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
        profileId: 1,
        mediaId: 1
      };
      
      // Mock watchHistoryService.markAsWatched to throw an error
      const error = new Error('Database error');
      watchHistoryService.markAsWatched.mockRejectedValue(error);
      
      // Call the method
      await watchHistoryController.markAsWatched(req, res);
      
      // Assertions
      expect(watchHistoryService.markAsWatched).toHaveBeenCalledWith(1, 1, 100);
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
  
  describe('updateHistory', () => {
    it('should update history successfully', async () => {
      // Mock request parameters and body
      req.params = {
        historyId: '1'
      };
      req.body = {
        progress: 75,
        watched_at: new Date()
      };
      
      // Mock watchHistoryService.updateHistory
      const mockUpdatedHistory = {
        history_id: 1,
        profile_id: 1,
        media_id: 1,
        progress: 75,
        watched_at: new Date()
      };
      watchHistoryService.updateHistory.mockResolvedValue(mockUpdatedHistory);
      
      // Call the method
      await watchHistoryController.updateHistory(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyHistoryOwnership).toHaveBeenCalledWith(1, '1');
      expect(watchHistoryService.updateHistory).toHaveBeenCalledWith('1', req.body);
      expect(watchHistoryController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Watch history updated",
          history: mockUpdatedHistory
        }
      );
      expect(watchHistoryController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if history ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      req.body = {
        progress: 75
      };
      
      // Call the method
      await watchHistoryController.updateHistory(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyHistoryOwnership).not.toHaveBeenCalled();
      expect(watchHistoryService.updateHistory).not.toHaveBeenCalled();
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide a historyId to update."
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if history does not belong to user', async () => {
      // Mock request parameters
      req.params = {
        historyId: '1'
      };
      req.body = {
        progress: 75
      };
      
      // Mock verifyHistoryOwnership to return false
      watchHistoryController.verifyHistoryOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchHistoryController.updateHistory(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyHistoryOwnership).toHaveBeenCalledWith(1, '1');
      expect(watchHistoryService.updateHistory).not.toHaveBeenCalled();
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to update this watch history"
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if history record is not found', async () => {
      // Mock request parameters
      req.params = {
        historyId: '999'
      };
      req.body = {
        progress: 75
      };
      
      // Mock watchHistoryService.updateHistory to return null
      watchHistoryService.updateHistory.mockResolvedValue(null);
      
      // Call the method
      await watchHistoryController.updateHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.updateHistory).toHaveBeenCalledWith('999', req.body);
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Watch history record not found"
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        historyId: '1'
      };
      req.body = {
        progress: 75
      };
      
      // Mock watchHistoryService.updateHistory to throw an error
      const error = new Error('Database error');
      watchHistoryService.updateHistory.mockRejectedValue(error);
      
      // Call the method
      await watchHistoryController.updateHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.updateHistory).toHaveBeenCalledWith('1', req.body);
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error updating watch history",
        error.message
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteHistory', () => {
    it('should delete history successfully', async () => {
      // Mock request parameters
      req.params = {
        historyId: '1'
      };
      
      // Mock watchHistoryService.deleteHistory
      watchHistoryService.deleteHistory.mockResolvedValue(true);
      
      // Call the method
      await watchHistoryController.deleteHistory(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyHistoryOwnership).toHaveBeenCalledWith(1, '1');
      expect(watchHistoryService.deleteHistory).toHaveBeenCalledWith('1');
      expect(watchHistoryController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Watch history deleted successfully"
        }
      );
      expect(watchHistoryController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if history ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await watchHistoryController.deleteHistory(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyHistoryOwnership).not.toHaveBeenCalled();
      expect(watchHistoryService.deleteHistory).not.toHaveBeenCalled();
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide a historyId to delete."
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if history does not belong to user', async () => {
      // Mock request parameters
      req.params = {
        historyId: '1'
      };
      
      // Mock verifyHistoryOwnership to return false
      watchHistoryController.verifyHistoryOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchHistoryController.deleteHistory(req, res);
      
      // Assertions
      expect(watchHistoryController.verifyHistoryOwnership).toHaveBeenCalledWith(1, '1');
      expect(watchHistoryService.deleteHistory).not.toHaveBeenCalled();
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to delete this watch history"
      );
      expect(watchHistoryController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        historyId: '1'
      };
      
      // Mock watchHistoryService.deleteHistory to throw an error
      const error = new Error('Database error');
      watchHistoryService.deleteHistory.mockRejectedValue(error);
      
      // Call the method
      await watchHistoryController.deleteHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.deleteHistory).toHaveBeenCalledWith('1');
      expect(watchHistoryController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error deleting watch history",
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
      const mockHistoryEntry = {
        history_id: 1,
        profile_id: 1,
        media_id: 1,
        watched_at: new Date()
      };
      watchHistoryService.getHistoryItemById.mockResolvedValue(mockHistoryEntry);
      
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
      expect(watchHistoryService.removeFromHistory).not.toHaveBeenCalled();
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
      expect(watchHistoryController.verifyProfileOwnership).not.toHaveBeenCalled();
      expect(watchHistoryService.removeFromHistory).not.toHaveBeenCalled();
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
      const mockHistoryEntry = {
        history_id: 1,
        profile_id: 2,
        media_id: 1,
        watched_at: new Date()
      };
      watchHistoryService.getHistoryItemById.mockResolvedValue(mockHistoryEntry);
      
      // Mock verifyProfileOwnership to return false
      watchHistoryController.verifyProfileOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchHistoryController.removeFromHistory(req, res);
      
      // Assertions
      expect(watchHistoryService.getHistoryItemById).toHaveBeenCalledWith('1');
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
      const mockHistoryEntry = {
        history_id: 1,
        profile_id: 1,
        media_id: 1,
        watched_at: new Date()
      };
      watchHistoryService.getHistoryItemById.mockResolvedValue(mockHistoryEntry);
      
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

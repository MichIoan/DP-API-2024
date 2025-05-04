/**
 * Unit tests for the Watch List Controller
 */
const watchListController = require('../../../src/controllers/watchListController');
const watchListService = require('../../../src/services/watchListService');
const profileService = require('../../../src/services/profileService');
const mediaService = require('../../../src/services/mediaService');

// Mock dependencies
jest.mock('../../../src/services/watchListService', () => ({
  getWatchList: jest.fn(),
  addToWatchList: jest.fn(),
  getWatchListItemById: jest.fn(),
  removeFromWatchList: jest.fn(),
  updateWatchList: jest.fn()
}));

jest.mock('../../../src/services/profileService', () => ({
  isProfileOwnedByUser: jest.fn()
}));

jest.mock('../../../src/services/mediaService', () => ({
  getMediaById: jest.fn()
}));

describe('WatchListController', () => {
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
    watchListController.handleSuccess = jest.fn();
    watchListController.handleError = jest.fn();
    watchListController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
    watchListController.verifyProfileOwnership = jest.fn().mockResolvedValue(true);
    watchListController.verifyWatchListOwnership = jest.fn().mockResolvedValue(true);
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('getWatchList', () => {
    it('should get watch list successfully', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock watchListService.getWatchList
      const mockWatchList = [
        { watchlist_id: 1, profile_id: 1, media_id: 1, added_at: new Date() },
        { watchlist_id: 2, profile_id: 1, media_id: 2, added_at: new Date() }
      ];
      watchListService.getWatchList.mockResolvedValue(mockWatchList);
      
      // Call the method
      await watchListController.getWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchList).toHaveBeenCalledWith('1', 20);
      expect(watchListController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { watchList: mockWatchList }
      );
      expect(watchListController.handleError).not.toHaveBeenCalled();
    });
    
    it('should use default limit if not provided', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock watchListService.getWatchList
      watchListService.getWatchList.mockResolvedValue([]);
      
      // Call the method
      await watchListController.getWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchList).toHaveBeenCalledWith('1', 20);
    });
    
    it('should return empty array message if watch list is empty', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock watchListService.getWatchList to return empty array
      watchListService.getWatchList.mockResolvedValue([]);
      
      // Call the method
      await watchListController.getWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchList).toHaveBeenCalledWith('1', 20);
      expect(watchListController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { 
          message: "Watch list is empty",
          watchList: [] 
        }
      );
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      
      // Mock watchListService.getWatchList to throw an error
      const error = new Error('Database error');
      watchListService.getWatchList.mockRejectedValue(error);
      
      // Call the method
      await watchListController.getWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchList).toHaveBeenCalledWith('1', 20);
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving watch list",
        error.message
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('addToWatchList', () => {
    it('should add media to watch list successfully', async () => {
      // Mock request body
      req.body = {
        profileId: 1,
        mediaId: 1
      };
      
      // Mock watchListService.addToWatchList
      const mockWatchListEntry = {
        watchlist_id: 1,
        profile_id: 1,
        media_id: 1,
        added_at: new Date()
      };
      watchListService.addToWatchList.mockResolvedValue(mockWatchListEntry);
      
      // Call the method
      await watchListController.addToWatchList(req, res);
      
      // Assertions
      expect(watchListController.verifyProfileOwnership).toHaveBeenCalledWith(1, 1);
      expect(watchListService.addToWatchList).toHaveBeenCalledWith(1, 1);
      expect(watchListController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        {
          message: "Added to watch list",
          watchListEntry: mockWatchListEntry
        }
      );
      expect(watchListController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Empty request body
      req.body = {};
      
      // Mock validation to fail
      watchListController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['profileId', 'mediaId']
      });
      
      // Call the method
      await watchListController.addToWatchList(req, res);
      
      // Assertions
      expect(watchListController.verifyProfileOwnership).not.toHaveBeenCalled();
      expect(watchListService.addToWatchList).not.toHaveBeenCalled();
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide profileId and mediaId."
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile does not belong to user', async () => {
      // Mock request body
      req.body = {
        profileId: 2,
        mediaId: 1
      };
      
      // Mock verifyProfileOwnership to return false
      watchListController.verifyProfileOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchListController.addToWatchList(req, res);
      
      // Assertions
      expect(watchListController.verifyProfileOwnership).toHaveBeenCalledWith(1, 2);
      expect(watchListService.addToWatchList).not.toHaveBeenCalled();
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to modify this profile's watch list"
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 409 if media already in watch list', async () => {
      // Mock request body
      req.body = {
        profileId: 1,
        mediaId: 1
      };
      
      // Mock watchListService.addToWatchList to throw duplicate entry error
      const error = new Error('Media already in watch list');
      error.code = 'DUPLICATE_ENTRY';
      watchListService.addToWatchList.mockRejectedValue(error);
      
      // Call the method
      await watchListController.addToWatchList(req, res);
      
      // Assertions
      expect(watchListService.addToWatchList).toHaveBeenCalledWith(1, 1);
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        409, 
        "This media is already in your watch list"
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request body
      req.body = {
        profileId: 1,
        mediaId: 1
      };
      
      // Mock watchListService.addToWatchList to throw a general error
      const error = new Error('Database error');
      watchListService.addToWatchList.mockRejectedValue(error);
      
      // Call the method
      await watchListController.addToWatchList(req, res);
      
      // Assertions
      expect(watchListService.addToWatchList).toHaveBeenCalledWith(1, 1);
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error adding to watch list",
        error.message
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('updateWatchList', () => {
    it('should update watch list entry successfully', async () => {
      // Mock request parameters and body
      req.params = {
        watchListId: '1'
      };
      req.body = {
        notes: 'Must watch soon',
        priority: 'high'
      };
      
      // Mock watchListService.updateWatchList
      const mockUpdatedEntry = {
        watchlist_id: 1,
        profile_id: 1,
        media_id: 1,
        notes: 'Must watch soon',
        priority: 'high',
        added_at: new Date()
      };
      watchListService.updateWatchList.mockResolvedValue(mockUpdatedEntry);
      
      // Call the method
      await watchListController.updateWatchList(req, res);
      
      // Assertions
      expect(watchListController.verifyWatchListOwnership).toHaveBeenCalledWith(1, '1');
      expect(watchListService.updateWatchList).toHaveBeenCalledWith('1', req.body);
      expect(watchListController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Watch list entry updated",
          watchListEntry: mockUpdatedEntry
        }
      );
      expect(watchListController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if watch list ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      req.body = {
        notes: 'Must watch soon'
      };
      
      // Call the method
      await watchListController.updateWatchList(req, res);
      
      // Assertions
      expect(watchListController.verifyWatchListOwnership).not.toHaveBeenCalled();
      expect(watchListService.updateWatchList).not.toHaveBeenCalled();
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Watch list item ID is required"
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if watch list entry does not belong to user', async () => {
      // Mock request parameters
      req.params = {
        watchListId: '1'
      };
      req.body = {
        notes: 'Must watch soon'
      };
      
      // Mock verifyWatchListOwnership to return false
      watchListController.verifyWatchListOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchListController.updateWatchList(req, res);
      
      // Assertions
      expect(watchListController.verifyWatchListOwnership).toHaveBeenCalledWith(1, '1');
      expect(watchListService.updateWatchList).not.toHaveBeenCalled();
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to update this watch list entry"
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if watch list entry is not found', async () => {
      // Mock request parameters
      req.params = {
        watchListId: '999'
      };
      req.body = {
        notes: 'Must watch soon'
      };
      
      // Mock watchListService.updateWatchList to return null
      watchListService.updateWatchList.mockResolvedValue(null);
      
      // Call the method
      await watchListController.updateWatchList(req, res);
      
      // Assertions
      expect(watchListService.updateWatchList).toHaveBeenCalledWith('999', req.body);
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Watch list entry not found"
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        watchListId: '1'
      };
      req.body = {
        notes: 'Must watch soon'
      };
      
      // Mock watchListService.updateWatchList to throw an error
      const error = new Error('Database error');
      watchListService.updateWatchList.mockRejectedValue(error);
      
      // Call the method
      await watchListController.updateWatchList(req, res);
      
      // Assertions
      expect(watchListService.updateWatchList).toHaveBeenCalledWith('1', req.body);
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error updating watch list entry",
        error.message
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('removeFromWatchList', () => {
    it('should remove item from watch list successfully', async () => {
      // Mock request parameters
      req.params = {
        watchListId: '1'
      };
      
      // Mock watchListService.getWatchListItemById
      const mockWatchListItem = {
        watchlist_id: 1,
        profile_id: 1,
        media_id: 1,
        added_at: new Date()
      };
      watchListService.getWatchListItemById.mockResolvedValue(mockWatchListItem);
      
      // Mock watchListService.removeFromWatchList
      watchListService.removeFromWatchList.mockResolvedValue(true);
      
      // Call the method
      await watchListController.removeFromWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchListItemById).toHaveBeenCalledWith('1');
      expect(watchListController.verifyProfileOwnership).toHaveBeenCalledWith(1, 1);
      expect(watchListService.removeFromWatchList).toHaveBeenCalledWith('1');
      expect(watchListController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { message: "Item removed from watch list successfully" }
      );
      expect(watchListController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if watch list ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await watchListController.removeFromWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchListItemById).not.toHaveBeenCalled();
      expect(watchListService.removeFromWatchList).not.toHaveBeenCalled();
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Watch list item ID is required"
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if watch list item is not found', async () => {
      // Mock request parameters
      req.params = {
        watchListId: '999'
      };
      
      // Mock watchListService.getWatchListItemById to return null
      watchListService.getWatchListItemById.mockResolvedValue(null);
      
      // Call the method
      await watchListController.removeFromWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchListItemById).toHaveBeenCalledWith('999');
      expect(watchListController.verifyProfileOwnership).not.toHaveBeenCalled();
      expect(watchListService.removeFromWatchList).not.toHaveBeenCalled();
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Watch list item not found"
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile does not belong to user', async () => {
      // Mock request parameters
      req.params = {
        watchListId: '1'
      };
      
      // Mock watchListService.getWatchListItemById
      const mockWatchListItem = {
        watchlist_id: 1,
        profile_id: 2, // Different profile
        media_id: 1,
        added_at: new Date()
      };
      watchListService.getWatchListItemById.mockResolvedValue(mockWatchListItem);
      
      // Mock verifyProfileOwnership to return false
      watchListController.verifyProfileOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchListController.removeFromWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchListItemById).toHaveBeenCalledWith('1');
      expect(watchListController.verifyProfileOwnership).toHaveBeenCalledWith(1, 2);
      expect(watchListService.removeFromWatchList).not.toHaveBeenCalled();
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to modify this profile's watch list"
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        watchListId: '1'
      };
      
      // Mock watchListService.getWatchListItemById
      const mockWatchListItem = {
        watchlist_id: 1,
        profile_id: 1,
        media_id: 1,
        added_at: new Date()
      };
      watchListService.getWatchListItemById.mockResolvedValue(mockWatchListItem);
      
      // Mock watchListService.removeFromWatchList to throw an error
      const error = new Error('Database error');
      watchListService.removeFromWatchList.mockRejectedValue(error);
      
      // Call the method
      await watchListController.removeFromWatchList(req, res);
      
      // Assertions
      expect(watchListService.removeFromWatchList).toHaveBeenCalledWith('1');
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error removing item from watch list",
        error.message
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});
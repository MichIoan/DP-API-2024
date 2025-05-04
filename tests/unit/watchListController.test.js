/**
 * Unit tests for the Watch List Controller
 */
const WatchListController = require('../../src/controllers/watchListController');
const watchListService = require('../../src/services/watchListService');

// Mock dependencies
jest.mock('../../src/services/watchListService');

describe('WatchListController', () => {
  let watchListController;
  let req;
  let res;
  
  beforeEach(() => {
    // Get the instance of WatchListController
    watchListController = require('../../src/controllers/watchListController');
    
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
    watchListController.handleSuccess = jest.fn();
    watchListController.handleError = jest.fn();
    watchListController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
    watchListController.verifyProfileOwnership = jest.fn().mockResolvedValue(true);
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('getWatchList', () => {
    it('should get watch list successfully', async () => {
      // Mock request parameters
      req.params = {
        profileId: '1'
      };
      req.query = {
        limit: '10'
      };
      
      // Mock watchListService.getWatchList
      const mockWatchList = [
        {
          watchlist_id: 1,
          profile_id: 1,
          media_id: 1,
          added_date: '2023-05-01T12:30:00Z',
          media: {
            title: 'Test Movie',
            media_type: 'movie'
          }
        },
        {
          watchlist_id: 2,
          profile_id: 1,
          media_id: 2,
          added_date: '2023-05-02T14:45:00Z',
          media: {
            title: 'Test Series',
            media_type: 'series'
          }
        }
      ];
      watchListService.getWatchList.mockResolvedValue(mockWatchList);
      
      // Call the method
      await watchListController.getWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchList).toHaveBeenCalledWith('1', 10);
      expect(watchListController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { watchList: mockWatchList }
      );
      expect(watchListController.handleError).not.toHaveBeenCalled();
    });
    
    it('should use default limit if not provided', async () => {
      // Mock request parameters without limit
      req.params = {
        profileId: '1'
      };
      req.query = {};
      
      // Mock watchListService.getWatchList
      const mockWatchList = [
        {
          watchlist_id: 1,
          profile_id: 1,
          media_id: 1,
          added_date: '2023-05-01T12:30:00Z'
        }
      ];
      watchListService.getWatchList.mockResolvedValue(mockWatchList);
      
      // Call the method
      await watchListController.getWatchList(req, res);
      
      // Assertions
      expect(watchListService.getWatchList).toHaveBeenCalledWith('1', 20); // Default limit
      expect(watchListController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { watchList: mockWatchList }
      );
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
      expect(watchListController.handleError).not.toHaveBeenCalled();
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
        profileId: '1',
        mediaId: '1'
      };
      
      // Mock validation
      watchListController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock verifyProfileOwnership
      watchListController.verifyProfileOwnership.mockResolvedValue(true);
      
      // Mock watchListService.addToWatchList
      const mockResult = {
        watchlist_id: 1,
        profile_id: 1,
        media_id: 1,
        added_date: '2023-05-04T15:30:00Z'
      };
      watchListService.addToWatchList.mockResolvedValue(mockResult);
      
      // Call the method
      await watchListController.addToWatchList(req, res);
      
      // Assertions
      expect(watchListController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['profileId', 'mediaId']
      );
      expect(watchListController.verifyProfileOwnership).toHaveBeenCalledWith(1, '1');
      expect(watchListService.addToWatchList).toHaveBeenCalledWith('1', '1');
      expect(watchListController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        {
          message: "Media added to watch list successfully",
          watchListItem: mockResult
        }
      );
      expect(watchListController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Request body with missing fields
      req.body = {
        profileId: '1'
        // Missing mediaId
      };
      
      // Mock validation to fail
      watchListController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['mediaId']
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
        profileId: '1',
        mediaId: '1'
      };
      
      // Mock validation
      watchListController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock verifyProfileOwnership to return false
      watchListController.verifyProfileOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchListController.addToWatchList(req, res);
      
      // Assertions
      expect(watchListController.verifyProfileOwnership).toHaveBeenCalledWith(1, '1');
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
        profileId: '1',
        mediaId: '1'
      };
      
      // Mock validation
      watchListController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock verifyProfileOwnership
      watchListController.verifyProfileOwnership.mockResolvedValue(true);
      
      // Mock watchListService.addToWatchList to throw conflict error
      const error = new Error('Media already in watch list');
      error.status = 409;
      watchListService.addToWatchList.mockRejectedValue(error);
      
      // Call the method
      await watchListController.addToWatchList(req, res);
      
      // Assertions
      expect(watchListService.addToWatchList).toHaveBeenCalledWith('1', '1');
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        409, 
        "Media already in watch list"
      );
      expect(watchListController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request body
      req.body = {
        profileId: '1',
        mediaId: '1'
      };
      
      // Mock validation
      watchListController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock verifyProfileOwnership
      watchListController.verifyProfileOwnership.mockResolvedValue(true);
      
      // Mock watchListService.addToWatchList to throw general error
      const error = new Error('Database error');
      watchListService.addToWatchList.mockRejectedValue(error);
      
      // Call the method
      await watchListController.addToWatchList(req, res);
      
      // Assertions
      expect(watchListService.addToWatchList).toHaveBeenCalledWith('1', '1');
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error adding media to watch list",
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
        media_id: 1
      };
      watchListService.getWatchListItemById.mockResolvedValue(mockWatchListItem);
      
      // Mock verifyProfileOwnership
      watchListController.verifyProfileOwnership.mockResolvedValue(true);
      
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
        media_id: 1
      };
      watchListService.getWatchListItemById.mockResolvedValue(mockWatchListItem);
      
      // Mock verifyProfileOwnership to return false
      watchListController.verifyProfileOwnership.mockResolvedValue(false);
      
      // Call the method
      await watchListController.removeFromWatchList(req, res);
      
      // Assertions
      expect(watchListController.verifyProfileOwnership).toHaveBeenCalledWith(1, 2);
      expect(watchListService.removeFromWatchList).not.toHaveBeenCalled();
      expect(watchListController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        403, 
        "You don't have permission to modify this watch list item"
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
        media_id: 1
      };
      watchListService.getWatchListItemById.mockResolvedValue(mockWatchListItem);
      
      // Mock verifyProfileOwnership
      watchListController.verifyProfileOwnership.mockResolvedValue(true);
      
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

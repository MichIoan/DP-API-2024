/**
 * Unit tests for the Media Controller
 */
const mediaController = require('../../../src/controllers/mediaController');
const mediaService = require('../../../src/services/mediaService');

// Mock dependencies
jest.mock('../../../src/services/mediaService', () => ({
  getAllMedia: jest.fn(),
  getMediaById: jest.fn(),
  searchMedia: jest.fn(),
  getRecommendedContent: jest.fn(),
  addToWatchList: jest.fn(),
  markAsWatched: jest.fn(),
  getWatchHistory: jest.fn(),
  getWatchList: jest.fn(),
  removeFromWatchList: jest.fn(),
  removeFromHistory: jest.fn()
}));

jest.mock('../../../src/models/Profile', () => ({
  Profile: {
    findOne: jest.fn()
  }
}));

describe('MediaController', () => {
  let req;
  let res;
  const { Profile } = require('../../../src/models/Profile');
  
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
    
    // Mock controller methods
    mediaController.handleSuccess = jest.fn();
    mediaController.handleError = jest.fn();
    mediaController.convertParams = jest.fn().mockImplementation((params, types) => params);
    
    // Mock Profile.findOne
    Profile.findOne.mockResolvedValue({ id: '123', user_id: 1 });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('getAllMedia', () => {
    it('should get all media successfully', async () => {
      // Mock query parameters
      req.query = {
        page: '1',
        limit: '10',
        genre: 'action',
        type: 'movie'
      };
      
      // Mock converted parameters
      const convertedParams = {
        page: 1,
        limit: 10,
        genre: 'action',
        type: 'movie'
      };
      mediaController.convertParams.mockReturnValue(convertedParams);
      
      // Mock mediaService.getAllMedia
      const mockResult = {
        media: [
          { media_id: 1, title: 'Movie 1' },
          { media_id: 2, title: 'Movie 2' }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1
        }
      };
      mediaService.getAllMedia.mockResolvedValue(mockResult);
      
      // Call the method
      await mediaController.getAllMedia(req, res);
      
      // Assertions
      expect(mediaController.convertParams).toHaveBeenCalledWith(req.query, {
        page: 'number',
        limit: 'number',
        genre: 'string',
        type: 'string',
        classification: 'string'
      });
      expect(mediaService.getAllMedia).toHaveBeenCalledWith(convertedParams);
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        mockResult
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock query parameters
      req.query = {
        page: '1',
        limit: '10'
      };
      
      // Mock mediaService.getAllMedia to throw a database error
      const error = new Error('Database error');
      error.name = 'SequelizeDatabaseError';
      mediaService.getAllMedia.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getAllMedia(req, res);
      
      // Assertions
      expect(mediaService.getAllMedia).toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Invalid query parameters",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getMediaById', () => {
    it('should get media by ID successfully', async () => {
      // Mock request parameters
      req.params = {
        mediaId: '1'
      };
      
      // Mock mediaService.getMediaById
      const mockMedia = {
        media_id: 1,
        title: 'Test Movie',
        description: 'Test Description'
      };
      mediaService.getMediaById.mockResolvedValue(mockMedia);
      
      // Call the method
      await mediaController.getMediaById(req, res);
      
      // Assertions
      expect(mediaService.getMediaById).toHaveBeenCalledWith('1');
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { media: mockMedia }
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if media ID is missing', async () => {
      // Call the method
      await mediaController.getMediaById(req, res);
      
      // Assertions
      expect(mediaService.getMediaById).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Media ID is required"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if media is not found', async () => {
      // Mock request parameters
      req.params = {
        mediaId: '999'
      };
      
      // Mock mediaService.getMediaById to return null
      mediaService.getMediaById.mockResolvedValue(null);
      
      // Call the method
      await mediaController.getMediaById(req, res);
      
      // Assertions
      expect(mediaService.getMediaById).toHaveBeenCalledWith('999');
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Media not found"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('searchMedia', () => {
    it('should search media successfully', async () => {
      // Mock query parameters
      req.query = {
        query: 'test',
        limit: '10'
      };
      
      // Mock mediaService.searchMedia
      const mockResults = [
        { media_id: 1, title: 'Test Movie 1' },
        { media_id: 2, title: 'Test Movie 2' }
      ];
      mediaService.searchMedia.mockResolvedValue(mockResults);
      
      // Call the method
      await mediaController.searchMedia(req, res);
      
      // Assertions
      expect(mediaService.searchMedia).toHaveBeenCalledWith('test', 10);
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { 
          results: mockResults,
          count: mockResults.length 
        }
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if search query is missing', async () => {
      // Empty query parameters
      req.query = {
        limit: '10'
      };
      
      // Call the method
      await mediaController.searchMedia(req, res);
      
      // Assertions
      expect(mediaService.searchMedia).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Search query is required"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock query parameters
      req.query = {
        query: 'test'
      };
      
      // Mock mediaService.searchMedia to throw an error
      const error = new Error('Search error');
      mediaService.searchMedia.mockRejectedValue(error);
      
      // Call the method
      await mediaController.searchMedia(req, res);
      
      // Assertions
      expect(mediaService.searchMedia).toHaveBeenCalledWith('test', 20);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error searching media",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getRecommendedContent', () => {
    it('should get recommended content successfully', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      
      // Mock mediaService.getRecommendedContent
      const mockRecommendations = [
        { media_id: 1, title: 'Recommended Movie 1', match_score: 0.95 },
        { media_id: 2, title: 'Recommended Movie 2', match_score: 0.85 }
      ];
      mediaService.getRecommendedContent.mockResolvedValue(mockRecommendations);
      
      // Call the method
      await mediaController.getRecommendedContent(req, res);
      
      // Assertions
      expect(mediaService.getRecommendedContent).toHaveBeenCalledWith('123', 10);
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { recommendations: mockRecommendations }
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      
      // Mock mediaService.getRecommendedContent to throw an error
      const error = new Error('Recommendation error');
      mediaService.getRecommendedContent.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getRecommendedContent(req, res);
      
      // Assertions
      expect(mediaService.getRecommendedContent).toHaveBeenCalledWith('123', 10);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving recommendations",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('addToWatchList', () => {
    it('should add media to watch list successfully', async () => {
      // Mock request body
      req.userId = 1;
      req.body = {
        profileId: '123',
        mediaId: '456'
      };
      
      // Mock validateRequiredFields
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
      
      // Mock mediaService.addToWatchList
      const mockWatchListEntry = {
        id: '789',
        profile_id: '123',
        media_id: '456',
        added_at: new Date()
      };
      mediaService.addToWatchList.mockResolvedValue(mockWatchListEntry);
      
      // Call the method
      await mediaController.addToWatchList(req, res);
      
      // Assertions
      expect(mediaController.validateRequiredFields).toHaveBeenCalledWith(
        req.body,
        ['profileId', 'mediaId']
      );
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: {
          id: '123',
          user_id: 1
        }
      });
      expect(mediaService.addToWatchList).toHaveBeenCalledWith('123', '456');
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        201,
        {
          message: "Added to watch list",
          watchListEntry: mockWatchListEntry
        }
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request body with missing fields
      req.body = {
        profileId: '123'
        // mediaId is missing
      };
      
      // Mock validateRequiredFields to return invalid
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ 
        isValid: false,
        message: "Missing required fields: mediaId"
      });
      
      // Call the method
      await mediaController.addToWatchList(req, res);
      
      // Assertions
      expect(mediaController.validateRequiredFields).toHaveBeenCalledWith(
        req.body,
        ['profileId', 'mediaId']
      );
      expect(Profile.findOne).not.toHaveBeenCalled();
      expect(mediaService.addToWatchList).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Profile ID and Media ID are required"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile does not belong to user', async () => {
      // Mock request body
      req.userId = 1;
      req.body = {
        profileId: '999',
        mediaId: '456'
      };
      
      // Mock validateRequiredFields
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
      
      // Mock Profile.findOne to return null (profile not found or doesn't belong to user)
      Profile.findOne.mockResolvedValue(null);
      
      // Call the method
      await mediaController.addToWatchList(req, res);
      
      // Assertions
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: {
          id: '999',
          user_id: 1
        }
      });
      expect(mediaService.addToWatchList).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        403,
        "You don't have permission to modify this profile's watch list"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 409 if media is already in watch list', async () => {
      // Mock request body
      req.userId = 1;
      req.body = {
        profileId: '123',
        mediaId: '456'
      };
      
      // Mock validateRequiredFields
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
      
      // Mock mediaService.addToWatchList to throw a unique constraint error
      const error = new Error('Unique constraint violation');
      error.name = 'SequelizeUniqueConstraintError';
      mediaService.addToWatchList.mockRejectedValue(error);
      
      // Call the method
      await mediaController.addToWatchList(req, res);
      
      // Assertions
      expect(mediaService.addToWatchList).toHaveBeenCalledWith('123', '456');
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        409,
        "Media is already in the watch list"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if media is not found', async () => {
      // Mock request body
      req.userId = 1;
      req.body = {
        profileId: '123',
        mediaId: '999'
      };
      
      // Mock validateRequiredFields
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
      
      // Mock mediaService.addToWatchList to throw a not found error
      const error = new Error('Media not found');
      mediaService.addToWatchList.mockRejectedValue(error);
      
      // Call the method
      await mediaController.addToWatchList(req, res);
      
      // Assertions
      expect(mediaService.addToWatchList).toHaveBeenCalledWith('123', '999');
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        404,
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request body
      req.userId = 1;
      req.body = {
        profileId: '123',
        mediaId: '456'
      };
      
      // Mock validateRequiredFields
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
      
      // Mock mediaService.addToWatchList to throw a general error
      const error = new Error('General error');
      mediaService.addToWatchList.mockRejectedValue(error);
      
      // Call the method
      await mediaController.addToWatchList(req, res);
      
      // Assertions
      expect(mediaService.addToWatchList).toHaveBeenCalledWith('123', '456');
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        "Error adding to watch list",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('markAsWatched', () => {
    it('should mark media as watched successfully', async () => {
      // Mock request body
      req.userId = 1;
      req.body = {
        profileId: '123',
        mediaId: '456',
        progress: 100
      };
      
      // Mock validateRequiredFields
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
      
      // Mock mediaService.markAsWatched
      const mockHistoryEntry = {
        id: '789',
        profile_id: '123',
        media_id: '456',
        progress: 100,
        watched_at: new Date()
      };
      mediaService.markAsWatched.mockResolvedValue(mockHistoryEntry);
      
      // Call the method
      await mediaController.markAsWatched(req, res);
      
      // Assertions
      expect(mediaController.validateRequiredFields).toHaveBeenCalledWith(
        req.body,
        ['profileId', 'mediaId']
      );
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: {
          id: '123',
          user_id: 1
        }
      });
      expect(mediaService.markAsWatched).toHaveBeenCalledWith('123', '456', 100);
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        200,
        {
          message: "Marked as watched",
          watchHistoryEntry: mockHistoryEntry
        }
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request body with missing fields
      req.body = {
        profileId: '123'
        // mediaId is missing
      };
      
      // Mock validateRequiredFields to return invalid
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ 
        isValid: false,
        message: "Missing required fields: mediaId"
      });
      
      // Call the method
      await mediaController.markAsWatched(req, res);
      
      // Assertions
      expect(mediaController.validateRequiredFields).toHaveBeenCalledWith(
        req.body,
        ['profileId', 'mediaId']
      );
      expect(Profile.findOne).not.toHaveBeenCalled();
      expect(mediaService.markAsWatched).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Profile ID and Media ID are required"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile does not belong to user', async () => {
      // Mock request body
      req.userId = 1;
      req.body = {
        profileId: '999',
        mediaId: '456',
        progress: 100
      };
      
      // Mock validateRequiredFields
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
      
      // Mock Profile.findOne to return null (profile not found or doesn't belong to user)
      Profile.findOne.mockResolvedValue(null);
      
      // Call the method
      await mediaController.markAsWatched(req, res);
      
      // Assertions
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: {
          id: '999',
          user_id: 1
        }
      });
      expect(mediaService.markAsWatched).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        403,
        "You don't have permission to modify this profile's watch history"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if media is not found', async () => {
      // Mock request body
      req.userId = 1;
      req.body = {
        profileId: '123',
        mediaId: '999',
        progress: 100
      };
      
      // Mock validateRequiredFields
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
      
      // Mock mediaService.markAsWatched to throw a not found error
      const error = new Error('Media not found');
      mediaService.markAsWatched.mockRejectedValue(error);
      
      // Call the method
      await mediaController.markAsWatched(req, res);
      
      // Assertions
      expect(mediaService.markAsWatched).toHaveBeenCalledWith('123', '999', 100);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        404,
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request body
      req.userId = 1;
      req.body = {
        profileId: '123',
        mediaId: '456',
        progress: 100
      };
      
      // Mock validateRequiredFields
      mediaController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
      
      // Mock mediaService.markAsWatched to throw a general error
      const error = new Error('General error');
      mediaService.markAsWatched.mockRejectedValue(error);
      
      // Call the method
      await mediaController.markAsWatched(req, res);
      
      // Assertions
      expect(mediaService.markAsWatched).toHaveBeenCalledWith('123', '456', 100);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        "Error marking as watched",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getRecommendedContent', () => {
    it('should get recommended content successfully', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      
      // Mock mediaService.getRecommendedContent
      const mockRecommendations = [
        { media_id: 1, title: 'Recommended Movie 1', match_score: 0.95 },
        { media_id: 2, title: 'Recommended Movie 2', match_score: 0.85 }
      ];
      mediaService.getRecommendedContent.mockResolvedValue(mockRecommendations);
      
      // Call the method
      await mediaController.getRecommendedContent(req, res);
      
      // Assertions
      expect(mediaService.getRecommendedContent).toHaveBeenCalledWith('123', 10);
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { recommendations: mockRecommendations }
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      
      // Mock mediaService.getRecommendedContent to throw an error
      const error = new Error('Recommendation error');
      mediaService.getRecommendedContent.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getRecommendedContent(req, res);
      
      // Assertions
      expect(mediaService.getRecommendedContent).toHaveBeenCalledWith('123', 10);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving recommendations",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getWatchHistory', () => {
    it('should get watch history successfully', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      req.query = {
        limit: '10'
      };
      
      // Mock mediaService.getWatchHistory
      const mockHistory = [
        { id: '1', profile_id: '123', media_id: '456', progress: 100, watched_at: new Date() },
        { id: '2', profile_id: '123', media_id: '789', progress: 75, watched_at: new Date() }
      ];
      mediaService.getWatchHistory.mockResolvedValue(mockHistory);
      
      // Call the method
      await mediaController.getWatchHistory(req, res);
      
      // Assertions
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: {
          id: '123',
          user_id: 1
        }
      });
      expect(mediaService.getWatchHistory).toHaveBeenCalledWith('123', 10);
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        200,
        { history: mockHistory }
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should use default limit if not provided', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      req.query = {}; // No limit provided
      
      // Mock mediaService.getWatchHistory
      const mockHistory = [
        { id: '1', profile_id: '123', media_id: '456', progress: 100, watched_at: new Date() }
      ];
      mediaService.getWatchHistory.mockResolvedValue(mockHistory);
      
      // Call the method
      await mediaController.getWatchHistory(req, res);
      
      // Assertions
      expect(mediaService.getWatchHistory).toHaveBeenCalledWith('123', 20); // Default limit is 20
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        200,
        { history: mockHistory }
      );
    });
    
    it('should return 400 if profile ID is missing', async () => {
      // Mock request parameters with missing profile ID
      req.params = {}; // No profileId
      
      // Call the method
      await mediaController.getWatchHistory(req, res);
      
      // Assertions
      expect(Profile.findOne).not.toHaveBeenCalled();
      expect(mediaService.getWatchHistory).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Profile ID is required"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile does not belong to user', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '999'
      };
      
      // Mock Profile.findOne to return null (profile not found or doesn't belong to user)
      Profile.findOne.mockResolvedValue(null);
      
      // Call the method
      await mediaController.getWatchHistory(req, res);
      
      // Assertions
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: {
          id: '999',
          user_id: 1
        }
      });
      expect(mediaService.getWatchHistory).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        403,
        "You don't have permission to access this profile's watch history"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      
      // Mock mediaService.getWatchHistory to throw a database error
      const error = new Error('Database error');
      error.name = 'SequelizeDatabaseError';
      mediaService.getWatchHistory.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getWatchHistory(req, res);
      
      // Assertions
      expect(mediaService.getWatchHistory).toHaveBeenCalledWith('123', 20);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Invalid query parameters",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      
      // Mock mediaService.getWatchHistory to throw a general error
      const error = new Error('General error');
      mediaService.getWatchHistory.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getWatchHistory(req, res);
      
      // Assertions
      expect(mediaService.getWatchHistory).toHaveBeenCalledWith('123', 20);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        "Error retrieving watch history",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getWatchList', () => {
    it('should get watch list successfully', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      req.query = {
        limit: '10'
      };
      
      // Mock mediaService.getWatchList
      const mockWatchList = [
        { id: '1', profile_id: '123', media_id: '456', added_at: new Date() },
        { id: '2', profile_id: '123', media_id: '789', added_at: new Date() }
      ];
      mediaService.getWatchList.mockResolvedValue(mockWatchList);
      
      // Call the method
      await mediaController.getWatchList(req, res);
      
      // Assertions
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: {
          id: '123',
          user_id: 1
        }
      });
      expect(mediaService.getWatchList).toHaveBeenCalledWith('123', 10);
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        200,
        { watchList: mockWatchList }
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should use default limit if not provided', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      req.query = {}; // No limit provided
      
      // Mock mediaService.getWatchList
      const mockWatchList = [
        { id: '1', profile_id: '123', media_id: '456', added_at: new Date() }
      ];
      mediaService.getWatchList.mockResolvedValue(mockWatchList);
      
      // Call the method
      await mediaController.getWatchList(req, res);
      
      // Assertions
      expect(mediaService.getWatchList).toHaveBeenCalledWith('123', 20); // Default limit is 20
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        200,
        { watchList: mockWatchList }
      );
    });
    
    it('should return 400 if profile ID is missing', async () => {
      // Mock request parameters with missing profile ID
      req.params = {}; // No profileId
      
      // Call the method
      await mediaController.getWatchList(req, res);
      
      // Assertions
      expect(Profile.findOne).not.toHaveBeenCalled();
      expect(mediaService.getWatchList).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Profile ID is required"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile does not belong to user', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '999'
      };
      
      // Mock Profile.findOne to return null (profile not found or doesn't belong to user)
      Profile.findOne.mockResolvedValue(null);
      
      // Call the method
      await mediaController.getWatchList(req, res);
      
      // Assertions
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: {
          id: '999',
          user_id: 1
        }
      });
      expect(mediaService.getWatchList).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        403,
        "You don't have permission to access this profile's watch list"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      
      // Mock mediaService.getWatchList to throw a database error
      const error = new Error('Database error');
      error.name = 'SequelizeDatabaseError';
      mediaService.getWatchList.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getWatchList(req, res);
      
      // Assertions
      expect(mediaService.getWatchList).toHaveBeenCalledWith('123', 20);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Invalid query parameters",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      
      // Mock mediaService.getWatchList to throw a general error
      const error = new Error('General error');
      mediaService.getWatchList.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getWatchList(req, res);
      
      // Assertions
      expect(mediaService.getWatchList).toHaveBeenCalledWith('123', 20);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        "Error retrieving watch list",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  // Additional test cases for getMediaById
  describe('getMediaById', () => {
    it('should handle invalid ID format errors', async () => {
      // Mock request parameters
      req.params = {
        mediaId: 'invalid-id'
      };
      
      // Mock mediaService.getMediaById to throw an error
      const error = new Error('invalid input syntax');
      error.name = 'SequelizeDatabaseError';
      error.message = 'invalid input syntax for type uuid';
      mediaService.getMediaById.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getMediaById(req, res);
      
      // Assertions
      expect(mediaService.getMediaById).toHaveBeenCalledWith('invalid-id');
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Invalid media ID format"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters
      req.params = {
        mediaId: '1'
      };
      
      // Mock mediaService.getMediaById to throw a general error
      const error = new Error('General error');
      mediaService.getMediaById.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getMediaById(req, res);
      
      // Assertions
      expect(mediaService.getMediaById).toHaveBeenCalledWith('1');
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        "Error retrieving media",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  // Additional test cases for getAllMedia
  describe('getAllMedia', () => {
    it('should handle general errors', async () => {
      // Mock query parameters
      req.query = {
        page: '1',
        limit: '10'
      };
      
      // Mock mediaService.getAllMedia to throw a general error
      const error = new Error('General error');
      mediaService.getAllMedia.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getAllMedia(req, res);
      
      // Assertions
      expect(mediaService.getAllMedia).toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        500,
        "Error retrieving media",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  // Additional test cases for searchMedia
  describe('searchMedia', () => {
    it('should handle database errors', async () => {
      // Mock query parameters
      req.query = {
        query: 'test'
      };
      
      // Mock mediaService.searchMedia to throw a database error
      const error = new Error('Database error');
      error.name = 'SequelizeDatabaseError';
      mediaService.searchMedia.mockRejectedValue(error);
      
      // Call the method
      await mediaController.searchMedia(req, res);
      
      // Assertions
      expect(mediaService.searchMedia).toHaveBeenCalledWith('test', 20);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Invalid search parameters",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  // Additional test cases for getRecommendedContent
  describe('getRecommendedContent', () => {
    it('should use limit from query parameters if provided', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      req.query = {
        limit: '15' // Custom limit
      };
      
      // Mock mediaService.getRecommendedContent
      const mockRecommendations = [
        { media_id: 1, title: 'Recommended Movie 1' },
        { media_id: 2, title: 'Recommended Movie 2' }
      ];
      mediaService.getRecommendedContent.mockResolvedValue(mockRecommendations);
      
      // Call the method
      await mediaController.getRecommendedContent(req, res);
      
      // Assertions
      expect(mediaService.getRecommendedContent).toHaveBeenCalledWith('123', 15);
      expect(mediaController.handleSuccess).toHaveBeenCalledWith(
        req,
        res,
        200,
        { recommendations: mockRecommendations }
      );
      expect(mediaController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if profile ID is missing', async () => {
      // Mock request parameters with missing profile ID
      req.params = {}; // No profileId
      
      // Call the method
      await mediaController.getRecommendedContent(req, res);
      
      // Assertions
      expect(Profile.findOne).not.toHaveBeenCalled();
      expect(mediaService.getRecommendedContent).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Profile ID is required"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 403 if profile does not belong to user', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '999'
      };
      
      // Mock Profile.findOne to return null (profile not found or doesn't belong to user)
      Profile.findOne.mockResolvedValue(null);
      
      // Call the method
      await mediaController.getRecommendedContent(req, res);
      
      // Assertions
      expect(Profile.findOne).toHaveBeenCalledWith({
        where: {
          id: '999',
          user_id: 1
        }
      });
      expect(mediaService.getRecommendedContent).not.toHaveBeenCalled();
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        403,
        "You don't have permission to access this profile's recommendations"
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle database errors', async () => {
      // Mock request parameters
      req.userId = 1;
      req.params = {
        profileId: '123'
      };
      
      // Mock mediaService.getRecommendedContent to throw a database error
      const error = new Error('Database error');
      error.name = 'SequelizeDatabaseError';
      mediaService.getRecommendedContent.mockRejectedValue(error);
      
      // Call the method
      await mediaController.getRecommendedContent(req, res);
      
      // Assertions
      expect(mediaService.getRecommendedContent).toHaveBeenCalledWith('123', 10);
      expect(mediaController.handleError).toHaveBeenCalledWith(
        req,
        res,
        400,
        "Invalid request parameters",
        error.message
      );
      expect(mediaController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});

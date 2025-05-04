/**
 * Unit tests for the Subtitles Controller
 */
const SubtitlesController = require('../../src/controllers/subtitlesController');
const { Subtitles } = require('../../src/models');

// Mock dependencies
jest.mock('../../src/models', () => ({
  Subtitles: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    destroy: jest.fn()
  }
}));

describe('SubtitlesController', () => {
  let subtitlesController;
  let req;
  let res;
  
  beforeEach(() => {
    // Get the instance of SubtitlesController
    subtitlesController = require('../../src/controllers/subtitlesController');
    
    // Mock request and response objects
    req = {
      params: {},
      query: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock controller methods
    subtitlesController.handleSuccess = jest.fn();
    subtitlesController.handleError = jest.fn();
    subtitlesController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('createSubtitles', () => {
    it('should create subtitles successfully', async () => {
      // Mock request body
      req.body = {
        media_id: 1,
        language: 'en',
        file_path: '/subtitles/movie1_en.vtt'
      };
      
      // Mock validation
      subtitlesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock Subtitles.create
      const mockSubtitles = {
        subtitle_id: 1,
        media_id: 1,
        language: 'en',
        file_path: '/subtitles/movie1_en.vtt'
      };
      Subtitles.create.mockResolvedValue(mockSubtitles);
      
      // Call the method
      await subtitlesController.createSubtitles(req, res);
      
      // Assertions
      expect(subtitlesController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['media_id']
      );
      expect(Subtitles.create).toHaveBeenCalledWith({
        media_id: 1,
        language: 'en',
        file_path: '/subtitles/movie1_en.vtt'
      });
      expect(subtitlesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        {
          message: "Subtitles created successfully.",
          subtitles: mockSubtitles
        }
      );
      expect(subtitlesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should use default values if not provided', async () => {
      // Mock request body with minimal fields
      req.body = {
        media_id: 1
      };
      
      // Mock validation
      subtitlesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock Subtitles.create
      const mockSubtitles = {
        subtitle_id: 1,
        media_id: 1,
        language: 'en',
        file_path: null
      };
      Subtitles.create.mockResolvedValue(mockSubtitles);
      
      // Call the method
      await subtitlesController.createSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.create).toHaveBeenCalledWith({
        media_id: 1,
        language: 'en',
        file_path: null
      });
      expect(subtitlesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        {
          message: "Subtitles created successfully.",
          subtitles: mockSubtitles
        }
      );
    });
    
    it('should return 400 if media_id is missing', async () => {
      // Empty request body
      req.body = {};
      
      // Mock validation to fail
      subtitlesController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['media_id']
      });
      
      // Call the method
      await subtitlesController.createSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.create).not.toHaveBeenCalled();
      expect(subtitlesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide a media_id for the subtitles."
      );
      expect(subtitlesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request body
      req.body = {
        media_id: 1,
        language: 'en'
      };
      
      // Mock validation
      subtitlesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock Subtitles.create to throw an error
      const error = new Error('Database error');
      Subtitles.create.mockRejectedValue(error);
      
      // Call the method
      await subtitlesController.createSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.create).toHaveBeenCalled();
      expect(subtitlesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Internal server error",
        error.message
      );
      expect(subtitlesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteSubtitles', () => {
    it('should delete subtitles successfully', async () => {
      // Mock request parameters
      req.params = {
        subtitleId: '1'
      };
      
      // Mock Subtitles.findByPk
      const mockSubtitles = {
        subtitle_id: 1,
        media_id: 1,
        language: 'en',
        destroy: jest.fn().mockResolvedValue(true)
      };
      Subtitles.findByPk.mockResolvedValue(mockSubtitles);
      
      // Call the method
      await subtitlesController.deleteSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.findByPk).toHaveBeenCalledWith('1');
      expect(mockSubtitles.destroy).toHaveBeenCalled();
      expect(subtitlesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { message: "Subtitles deleted successfully." }
      );
      expect(subtitlesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 404 if subtitles are not found', async () => {
      // Mock request parameters
      req.params = {
        subtitleId: '999'
      };
      
      // Mock Subtitles.findByPk to return null
      Subtitles.findByPk.mockResolvedValue(null);
      
      // Call the method
      await subtitlesController.deleteSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.findByPk).toHaveBeenCalledWith('999');
      expect(subtitlesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Subtitles not found."
      );
      expect(subtitlesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        subtitleId: '1'
      };
      
      // Mock Subtitles.findByPk to throw an error
      const error = new Error('Database error');
      Subtitles.findByPk.mockRejectedValue(error);
      
      // Call the method
      await subtitlesController.deleteSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.findByPk).toHaveBeenCalledWith('1');
      expect(subtitlesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error deleting subtitles",
        error.message
      );
      expect(subtitlesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getSubtitlesForMedia', () => {
    it('should get subtitles for media successfully', async () => {
      // Mock request parameters
      req.params = {
        mediaId: '1'
      };
      
      // Mock Subtitles.findAll
      const mockSubtitles = [
        {
          subtitle_id: 1,
          media_id: 1,
          language: 'en',
          file_path: '/subtitles/movie1_en.vtt'
        },
        {
          subtitle_id: 2,
          media_id: 1,
          language: 'es',
          file_path: '/subtitles/movie1_es.vtt'
        }
      ];
      Subtitles.findAll.mockResolvedValue(mockSubtitles);
      
      // Call the method
      await subtitlesController.getSubtitlesForMedia(req, res);
      
      // Assertions
      expect(Subtitles.findAll).toHaveBeenCalledWith({
        where: { media_id: '1' }
      });
      expect(subtitlesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { subtitles: mockSubtitles }
      );
      expect(subtitlesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return empty array if no subtitles found', async () => {
      // Mock request parameters
      req.params = {
        mediaId: '1'
      };
      
      // Mock Subtitles.findAll to return empty array
      Subtitles.findAll.mockResolvedValue([]);
      
      // Call the method
      await subtitlesController.getSubtitlesForMedia(req, res);
      
      // Assertions
      expect(Subtitles.findAll).toHaveBeenCalledWith({
        where: { media_id: '1' }
      });
      expect(subtitlesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { 
          message: "No subtitles found for this media",
          subtitles: []
        }
      );
      expect(subtitlesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if media ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await subtitlesController.getSubtitlesForMedia(req, res);
      
      // Assertions
      expect(Subtitles.findAll).not.toHaveBeenCalled();
      expect(subtitlesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Media ID is required"
      );
      expect(subtitlesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        mediaId: '1'
      };
      
      // Mock Subtitles.findAll to throw an error
      const error = new Error('Database error');
      Subtitles.findAll.mockRejectedValue(error);
      
      // Call the method
      await subtitlesController.getSubtitlesForMedia(req, res);
      
      // Assertions
      expect(Subtitles.findAll).toHaveBeenCalledWith({
        where: { media_id: '1' }
      });
      expect(subtitlesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving subtitles",
        error.message
      );
      expect(subtitlesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('updateSubtitles', () => {
    it('should update subtitles successfully', async () => {
      // Mock request parameters and body
      req.params = {
        subtitleId: '1'
      };
      req.body = {
        language: 'fr',
        file_path: '/subtitles/movie1_fr.vtt'
      };
      
      // Mock Subtitles.findByPk
      const mockSubtitles = {
        subtitle_id: 1,
        media_id: 1,
        language: 'en',
        file_path: '/subtitles/movie1_en.vtt',
        update: jest.fn().mockResolvedValue({
          subtitle_id: 1,
          media_id: 1,
          language: 'fr',
          file_path: '/subtitles/movie1_fr.vtt'
        })
      };
      Subtitles.findByPk.mockResolvedValue(mockSubtitles);
      
      // Call the method
      await subtitlesController.updateSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.findByPk).toHaveBeenCalledWith('1');
      expect(mockSubtitles.update).toHaveBeenCalledWith(req.body);
      expect(subtitlesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Subtitles updated successfully.",
          subtitles: expect.objectContaining({
            language: 'fr',
            file_path: '/subtitles/movie1_fr.vtt'
          })
        }
      );
      expect(subtitlesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 404 if subtitles are not found', async () => {
      // Mock request parameters
      req.params = {
        subtitleId: '999'
      };
      req.body = {
        language: 'fr'
      };
      
      // Mock Subtitles.findByPk to return null
      Subtitles.findByPk.mockResolvedValue(null);
      
      // Call the method
      await subtitlesController.updateSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.findByPk).toHaveBeenCalledWith('999');
      expect(subtitlesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Subtitles not found."
      );
      expect(subtitlesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 400 if no update data is provided', async () => {
      // Mock request parameters with empty body
      req.params = {
        subtitleId: '1'
      };
      req.body = {};
      
      // Call the method
      await subtitlesController.updateSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.findByPk).not.toHaveBeenCalled();
      expect(subtitlesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "No update data provided"
      );
      expect(subtitlesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters and body
      req.params = {
        subtitleId: '1'
      };
      req.body = {
        language: 'fr'
      };
      
      // Mock Subtitles.findByPk to throw an error
      const error = new Error('Database error');
      Subtitles.findByPk.mockRejectedValue(error);
      
      // Call the method
      await subtitlesController.updateSubtitles(req, res);
      
      // Assertions
      expect(Subtitles.findByPk).toHaveBeenCalledWith('1');
      expect(subtitlesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error updating subtitles",
        error.message
      );
      expect(subtitlesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});

/**
 * Unit tests for the Series Controller
 */
const SeriesController = require('../../src/controllers/seriesController');
const seriesService = require('../../src/services/seriesService');

// Mock dependencies
jest.mock('../../src/services/seriesService');

describe('SeriesController', () => {
  let seriesController;
  let req;
  let res;
  
  beforeEach(() => {
    // Get the instance of SeriesController
    seriesController = require('../../src/controllers/seriesController');
    
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
    seriesController.handleSuccess = jest.fn();
    seriesController.handleError = jest.fn();
    seriesController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
    seriesController.convertParams = jest.fn().mockImplementation((params, types) => params);
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('createSeries', () => {
    it('should create a series successfully', async () => {
      // Mock request body
      req.body = {
        title: 'Test Series',
        description: 'Test description',
        release_date: '2023-01-01'
      };
      
      // Mock validation
      seriesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock seriesService.createSeries
      const mockSeries = {
        series_id: 1,
        title: 'Test Series',
        description: 'Test description',
        release_date: '2023-01-01'
      };
      seriesService.createSeries.mockResolvedValue(mockSeries);
      
      // Call the method
      await seriesController.createSeries(req, res);
      
      // Assertions
      expect(seriesController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['title']
      );
      expect(seriesService.createSeries).toHaveBeenCalledWith(req.body);
      expect(seriesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        {
          message: "Series created successfully.",
          series: mockSeries
        }
      );
      expect(seriesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request body with missing fields
      req.body = {
        description: 'Test description'
        // Missing title
      };
      
      // Mock validation to fail
      seriesController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['title']
      });
      
      // Call the method
      await seriesController.createSeries(req, res);
      
      // Assertions
      expect(seriesController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['title']
      );
      expect(seriesService.createSeries).not.toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide at least a title for the series."
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 500 for general errors', async () => {
      // Mock request body
      req.body = {
        title: 'Test Series'
      };
      
      // Mock validation
      seriesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock seriesService.createSeries to throw general error
      const error = new Error('Database error');
      seriesService.createSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.createSeries(req, res);
      
      // Assertions
      expect(seriesService.createSeries).toHaveBeenCalledWith(req.body);
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Internal server error",
        error.message
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getAllSeries', () => {
    it('should get all series successfully', async () => {
      // Mock query parameters
      req.query = {
        page: '1',
        limit: '10',
        genre: 'drama'
      };
      
      // Mock converted parameters
      const convertedParams = {
        page: 1,
        limit: 10,
        genre: 'drama'
      };
      seriesController.convertParams.mockReturnValue(convertedParams);
      
      // Mock seriesService.getAllSeries
      const mockResult = {
        series: [
          { series_id: 1, title: 'Series 1' },
          { series_id: 2, title: 'Series 2' }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1
        }
      };
      seriesService.getAllSeries.mockResolvedValue(mockResult);
      
      // Call the method
      await seriesController.getAllSeries(req, res);
      
      // Assertions
      expect(seriesController.convertParams).toHaveBeenCalledWith(req.query, {
        page: 'number',
        limit: 'number',
        genre: 'string',
        classification: 'string'
      });
      expect(seriesService.getAllSeries).toHaveBeenCalledWith(convertedParams);
      expect(seriesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        mockResult
      );
      expect(seriesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock query parameters
      req.query = {
        page: '1',
        limit: '10'
      };
      
      // Mock seriesService.getAllSeries to throw an error
      const error = new Error('Database error');
      seriesService.getAllSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.getAllSeries(req, res);
      
      // Assertions
      expect(seriesService.getAllSeries).toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving series",
        error.message
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getSeriesById', () => {
    it('should get series by ID successfully', async () => {
      // Mock request parameters
      req.params = {
        seriesId: '1'
      };
      
      // Mock seriesService.getSeriesById
      const mockSeries = {
        series_id: 1,
        title: 'Test Series',
        description: 'Test Description',
        release_date: '2023-01-01'
      };
      seriesService.getSeriesById.mockResolvedValue(mockSeries);
      
      // Call the method
      await seriesController.getSeriesById(req, res);
      
      // Assertions
      expect(seriesService.getSeriesById).toHaveBeenCalledWith('1');
      expect(seriesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { series: mockSeries }
      );
      expect(seriesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if series ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await seriesController.getSeriesById(req, res);
      
      // Assertions
      expect(seriesService.getSeriesById).not.toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Series ID is required"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if series is not found', async () => {
      // Mock request parameters
      req.params = {
        seriesId: '999'
      };
      
      // Mock seriesService.getSeriesById to return null
      seriesService.getSeriesById.mockResolvedValue(null);
      
      // Call the method
      await seriesController.getSeriesById(req, res);
      
      // Assertions
      expect(seriesService.getSeriesById).toHaveBeenCalledWith('999');
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Series not found"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        seriesId: '1'
      };
      
      // Mock seriesService.getSeriesById to throw an error
      const error = new Error('Database error');
      seriesService.getSeriesById.mockRejectedValue(error);
      
      // Call the method
      await seriesController.getSeriesById(req, res);
      
      // Assertions
      expect(seriesService.getSeriesById).toHaveBeenCalledWith('1');
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error retrieving series",
        error.message
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('updateSeries', () => {
    it('should update a series successfully', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '1'
      };
      req.body = {
        title: 'Updated Series',
        description: 'Updated description'
      };
      
      // Mock seriesService.updateSeries
      const mockUpdatedSeries = {
        series_id: 1,
        title: 'Updated Series',
        description: 'Updated description'
      };
      seriesService.updateSeries.mockResolvedValue(mockUpdatedSeries);
      
      // Call the method
      await seriesController.updateSeries(req, res);
      
      // Assertions
      expect(seriesService.updateSeries).toHaveBeenCalledWith('1', req.body);
      expect(seriesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Series updated successfully.",
          series: mockUpdatedSeries
        }
      );
      expect(seriesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if series ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      req.body = {
        title: 'Updated Series'
      };
      
      // Call the method
      await seriesController.updateSeries(req, res);
      
      // Assertions
      expect(seriesService.updateSeries).not.toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Series ID is required"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 400 if no update data is provided', async () => {
      // Mock request parameters with empty body
      req.params = {
        seriesId: '1'
      };
      req.body = {};
      
      // Call the method
      await seriesController.updateSeries(req, res);
      
      // Assertions
      expect(seriesService.updateSeries).not.toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "No update data provided"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if series is not found', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '999'
      };
      req.body = {
        title: 'Updated Series'
      };
      
      // Mock seriesService.updateSeries to throw not found error
      const error = new Error('Series not found');
      error.status = 404;
      seriesService.updateSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.updateSeries(req, res);
      
      // Assertions
      expect(seriesService.updateSeries).toHaveBeenCalledWith('999', req.body);
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Series not found"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '1'
      };
      req.body = {
        title: 'Updated Series'
      };
      
      // Mock seriesService.updateSeries to throw general error
      const error = new Error('Database error');
      seriesService.updateSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.updateSeries(req, res);
      
      // Assertions
      expect(seriesService.updateSeries).toHaveBeenCalledWith('1', req.body);
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error updating series",
        error.message
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteSeries', () => {
    it('should delete a series successfully', async () => {
      // Mock request parameters
      req.params = {
        seriesId: '1'
      };
      
      // Mock seriesService.deleteSeries
      seriesService.deleteSeries.mockResolvedValue(true);
      
      // Call the method
      await seriesController.deleteSeries(req, res);
      
      // Assertions
      expect(seriesService.deleteSeries).toHaveBeenCalledWith('1');
      expect(seriesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { message: "Series deleted successfully." }
      );
      expect(seriesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if series ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await seriesController.deleteSeries(req, res);
      
      // Assertions
      expect(seriesService.deleteSeries).not.toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Series ID is required"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if series is not found', async () => {
      // Mock request parameters
      req.params = {
        seriesId: '999'
      };
      
      // Mock seriesService.deleteSeries to throw not found error
      const error = new Error('Series not found');
      error.status = 404;
      seriesService.deleteSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.deleteSeries(req, res);
      
      // Assertions
      expect(seriesService.deleteSeries).toHaveBeenCalledWith('999');
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Series not found"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters
      req.params = {
        seriesId: '1'
      };
      
      // Mock seriesService.deleteSeries to throw general error
      const error = new Error('Database error');
      seriesService.deleteSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.deleteSeries(req, res);
      
      // Assertions
      expect(seriesService.deleteSeries).toHaveBeenCalledWith('1');
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error deleting series",
        error.message
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('addSeason', () => {
    it('should add a season successfully', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '1'
      };
      req.body = {
        season_number: 1,
        title: 'Season 1',
        release_date: '2023-01-01'
      };
      
      // Mock validation
      seriesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock seriesService.addSeason
      const mockSeason = {
        season_id: 1,
        series_id: 1,
        season_number: 1,
        title: 'Season 1',
        release_date: '2023-01-01'
      };
      seriesService.addSeason.mockResolvedValue(mockSeason);
      
      // Call the method
      await seriesController.addSeason(req, res);
      
      // Assertions
      expect(seriesController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['season_number']
      );
      expect(seriesService.addSeason).toHaveBeenCalledWith('1', req.body);
      expect(seriesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        {
          message: "Season added successfully.",
          season: mockSeason
        }
      );
      expect(seriesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if series ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      req.body = {
        season_number: 1
      };
      
      // Call the method
      await seriesController.addSeason(req, res);
      
      // Assertions
      expect(seriesService.addSeason).not.toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Series ID is required"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request parameters and body with missing fields
      req.params = {
        seriesId: '1'
      };
      req.body = {
        title: 'Season 1'
        // Missing season_number
      };
      
      // Mock validation to fail
      seriesController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['season_number']
      });
      
      // Call the method
      await seriesController.addSeason(req, res);
      
      // Assertions
      expect(seriesController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['season_number']
      );
      expect(seriesService.addSeason).not.toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Season number is required"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if series is not found', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '999'
      };
      req.body = {
        season_number: 1
      };
      
      // Mock validation
      seriesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock seriesService.addSeason to throw not found error
      const error = new Error('Series not found');
      error.status = 404;
      seriesService.addSeason.mockRejectedValue(error);
      
      // Call the method
      await seriesController.addSeason(req, res);
      
      // Assertions
      expect(seriesService.addSeason).toHaveBeenCalledWith('999', req.body);
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Series not found"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '1'
      };
      req.body = {
        season_number: 1
      };
      
      // Mock validation
      seriesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock seriesService.addSeason to throw general error
      const error = new Error('Database error');
      seriesService.addSeason.mockRejectedValue(error);
      
      // Call the method
      await seriesController.addSeason(req, res);
      
      // Assertions
      expect(seriesService.addSeason).toHaveBeenCalledWith('1', req.body);
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error adding season",
        error.message
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('addEpisode', () => {
    it('should add an episode successfully', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '1',
        seasonId: '1'
      };
      req.body = {
        episode_number: 1,
        title: 'Episode 1',
        duration: '00:45:00'
      };
      
      // Mock validation
      seriesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock seriesService.addEpisode
      const mockEpisode = {
        episode_id: 1,
        season_id: 1,
        episode_number: 1,
        title: 'Episode 1',
        duration: '00:45:00'
      };
      seriesService.addEpisode.mockResolvedValue(mockEpisode);
      
      // Call the method
      await seriesController.addEpisode(req, res);
      
      // Assertions
      expect(seriesController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['episode_number', 'title', 'duration']
      );
      expect(seriesService.addEpisode).toHaveBeenCalledWith('1', '1', req.body);
      expect(seriesController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        {
          message: "Episode added successfully.",
          episode: mockEpisode
        }
      );
      expect(seriesController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if series ID or season ID is missing', async () => {
      // Missing season ID
      req.params = {
        seriesId: '1'
        // Missing seasonId
      };
      req.body = {
        episode_number: 1,
        title: 'Episode 1',
        duration: '00:45:00'
      };
      
      // Call the method
      await seriesController.addEpisode(req, res);
      
      // Assertions
      expect(seriesService.addEpisode).not.toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Series ID and Season ID are required"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request parameters and body with missing fields
      req.params = {
        seriesId: '1',
        seasonId: '1'
      };
      req.body = {
        episode_number: 1,
        title: 'Episode 1'
        // Missing duration
      };
      
      // Mock validation to fail
      seriesController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['duration']
      });
      
      // Call the method
      await seriesController.addEpisode(req, res);
      
      // Assertions
      expect(seriesController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['episode_number', 'title', 'duration']
      );
      expect(seriesService.addEpisode).not.toHaveBeenCalled();
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Episode number, title, and duration are required"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if series or season is not found', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '1',
        seasonId: '999'
      };
      req.body = {
        episode_number: 1,
        title: 'Episode 1',
        duration: '00:45:00'
      };
      
      // Mock validation
      seriesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock seriesService.addEpisode to throw not found error
      const error = new Error('Season not found');
      error.status = 404;
      seriesService.addEpisode.mockRejectedValue(error);
      
      // Call the method
      await seriesController.addEpisode(req, res);
      
      // Assertions
      expect(seriesService.addEpisode).toHaveBeenCalledWith('1', '999', req.body);
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Season not found"
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle general errors', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '1',
        seasonId: '1'
      };
      req.body = {
        episode_number: 1,
        title: 'Episode 1',
        duration: '00:45:00'
      };
      
      // Mock validation
      seriesController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock seriesService.addEpisode to throw general error
      const error = new Error('Database error');
      seriesService.addEpisode.mockRejectedValue(error);
      
      // Call the method
      await seriesController.addEpisode(req, res);
      
      // Assertions
      expect(seriesService.addEpisode).toHaveBeenCalledWith('1', '1', req.body);
      expect(seriesController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Error adding episode",
        error.message
      );
      expect(seriesController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});

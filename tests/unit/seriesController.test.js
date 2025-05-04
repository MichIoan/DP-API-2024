/**
 * Unit tests for the Series Controller
 */
const seriesController = require('../../src/controllers/seriesController');
const seriesService = require('../../src/services/seriesService');

// Mock dependencies
jest.mock('../../src/services/seriesService');

describe('SeriesController', () => {
  let req;
  let res;
  
  beforeEach(() => {
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
      expect(seriesService.createSeries).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: {
          message: "Series created successfully.",
          series: mockSeries
        }
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request body with missing fields
      req.body = {
        description: 'Test description'
        // Missing title
      };
      
      // Call the method
      await seriesController.createSeries(req, res);
      
      // Assertions
      expect(seriesService.createSeries).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Please provide at least a title for the series."
      });
    });
    
    it('should return 500 for general errors', async () => {
      // Mock request body
      req.body = {
        title: 'Test Series'
      };
      
      // Mock seriesService.createSeries to throw general error
      const error = new Error('Database error');
      seriesService.createSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.createSeries(req, res);
      
      // Assertions
      expect(seriesService.createSeries).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Internal server error",
        errors: error.message
      });
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
      expect(seriesService.getAllSeries).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: mockResult
      });
    });
    
    it('should handle errors', async () => {
      // Mock query parameters
      req.query = {
        page: '1',
        limit: '10'
      };
      
      // Mock seriesService.getAllSeries to throw error
      const error = new Error('Database error');
      seriesService.getAllSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.getAllSeries(req, res);
      
      // Assertions
      expect(seriesService.getAllSeries).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Internal server error",
        errors: error.message
      });
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
        description: 'Test description'
      };
      seriesService.getSeriesById.mockResolvedValue(mockSeries);
      
      // Call the method
      await seriesController.getSeriesById(req, res);
      
      // Assertions
      expect(seriesService.getSeriesById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: { series: mockSeries }
      });
    });
    
    it('should return 400 if seriesId is missing', async () => {
      // Call the method with no seriesId
      await seriesController.getSeriesById(req, res);
      
      // Assertions
      expect(seriesService.getSeriesById).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Please provide a seriesId to retrieve."
      });
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
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Series not found."
      });
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        seriesId: '1'
      };
      
      // Mock seriesService.getSeriesById to throw error
      const error = new Error('Database error');
      seriesService.getSeriesById.mockRejectedValue(error);
      
      // Call the method
      await seriesController.getSeriesById(req, res);
      
      // Assertions
      expect(seriesService.getSeriesById).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Internal server error",
        errors: error.message
      });
    });
  });
  
  describe('updateSeries', () => {
    it('should update series successfully', async () => {
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
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: {
          message: "Series updated successfully.",
          series: mockUpdatedSeries
        }
      });
    });
    
    it('should return 400 if seriesId is missing', async () => {
      // Mock request body without seriesId
      req.body = {
        title: 'Updated Series'
      };
      
      // Call the method
      await seriesController.updateSeries(req, res);
      
      // Assertions
      expect(seriesService.updateSeries).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Please provide a seriesId to update."
      });
    });
    
    it('should return 404 if series is not found', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '999'
      };
      req.body = {
        title: 'Updated Series'
      };
      
      // Mock seriesService.updateSeries to return null
      seriesService.updateSeries.mockResolvedValue(null);
      
      // Call the method
      await seriesController.updateSeries(req, res);
      
      // Assertions
      expect(seriesService.updateSeries).toHaveBeenCalledWith('999', req.body);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Series not found."
      });
    });
    
    it('should handle errors', async () => {
      // Mock request parameters and body
      req.params = {
        seriesId: '1'
      };
      req.body = {
        title: 'Updated Series'
      };
      
      // Mock seriesService.updateSeries to throw error
      const error = new Error('Database error');
      seriesService.updateSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.updateSeries(req, res);
      
      // Assertions
      expect(seriesService.updateSeries).toHaveBeenCalledWith('1', req.body);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Internal server error",
        errors: error.message
      });
    });
  });
  
  describe('deleteSeries', () => {
    it('should delete series successfully', async () => {
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
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        message: 'Success',
        data: {
          message: "Series deleted successfully."
        }
      });
    });
    
    it('should return 400 if seriesId is missing', async () => {
      // Call the method with no seriesId
      await seriesController.deleteSeries(req, res);
      
      // Assertions
      expect(seriesService.deleteSeries).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Please provide a seriesId to delete."
      });
    });
    
    it('should return 404 if series is not found', async () => {
      // Mock request parameters
      req.params = {
        seriesId: '999'
      };
      
      // Mock seriesService.deleteSeries to return false
      seriesService.deleteSeries.mockResolvedValue(false);
      
      // Call the method
      await seriesController.deleteSeries(req, res);
      
      // Assertions
      expect(seriesService.deleteSeries).toHaveBeenCalledWith('999');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Series not found."
      });
    });
    
    it('should handle errors', async () => {
      // Mock request parameters
      req.params = {
        seriesId: '1'
      };
      
      // Mock seriesService.deleteSeries to throw error
      const error = new Error('Database error');
      seriesService.deleteSeries.mockRejectedValue(error);
      
      // Call the method
      await seriesController.deleteSeries(req, res);
      
      // Assertions
      expect(seriesService.deleteSeries).toHaveBeenCalledWith('1');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: "Internal server error",
        errors: error.message
      });
    });
  });
});

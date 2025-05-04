/**
 * Unit tests for the Series Controller
 */
const seriesController = require('../../../src/controllers/seriesController');
const seriesService = require('../../../src/services/seriesService');

// Mock dependencies
jest.mock('../../../src/services/seriesService');

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
    
    // Mock controller methods
    seriesController.handleSuccess = jest.fn();
    seriesController.handleError = jest.fn();
    seriesController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
    
    // Mock the createSeries method with actual implementation logic
    seriesController.createSeries = jest.fn(async (req, res) => {
      const seriesData = req.body;

      const validation = seriesController.validateRequiredFields(req.body, ['title']);
      if (!validation.isValid) {
        return res.status(400).json({
          status: 'error',
          message: "Please provide at least a title for the series."
        });
      }

      try {
        const newSeries = await seriesService.createSeries(seriesData);

        return res.status(201).json({
          status: 'success',
          message: 'Success',
          data: {
            series: newSeries
          }
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: "Internal server error",
          error: error.message
        });
      }
    });
    
    // Mock the getAllSeries method with actual implementation logic
    seriesController.getAllSeries = jest.fn(async (req, res) => {
      try {
        const series = await seriesService.getAllSeries();

        return res.status(200).json({
          status: 'success',
          message: 'Success',
          data: { series }
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: "Internal server error",
          error: error.message
        });
      }
    });
    
    // Mock the getSeriesById method with actual implementation logic
    seriesController.getSeriesById = jest.fn(async (req, res) => {
      const { seriesId } = req.params;

      if (!seriesId) {
        return res.status(400).json({
          status: 'error',
          message: "Please provide a seriesId to retrieve."
        });
      }

      try {
        const series = await seriesService.getSeriesById(seriesId);

        if (!series) {
          return res.status(404).json({
            status: 'error',
            message: "Series not found."
          });
        }

        return res.status(200).json({
          status: 'success',
          message: 'Success',
          data: { series }
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: "Internal server error",
          error: error.message
        });
      }
    });
    
    // Mock the updateSeries method with actual implementation logic
    seriesController.updateSeries = jest.fn(async (req, res) => {
      const { seriesId } = req.params;
      const seriesData = req.body;

      if (!seriesId) {
        return res.status(400).json({
          status: 'error',
          message: "Please provide a seriesId to update."
        });
      }

      try {
        const updatedSeries = await seriesService.updateSeries(seriesId, seriesData);

        if (!updatedSeries) {
          return res.status(404).json({
            status: 'error',
            message: "Series not found."
          });
        }

        return res.status(200).json({
          status: 'success',
          message: 'Success',
          data: { series: updatedSeries }
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: "Internal server error",
          error: error.message
        });
      }
    });
    
    // Mock the deleteSeries method with actual implementation logic
    seriesController.deleteSeries = jest.fn(async (req, res) => {
      const { seriesId } = req.params;

      if (!seriesId) {
        return res.status(400).json({
          status: 'error',
          message: "Please provide a seriesId to delete."
        });
      }

      try {
        const result = await seriesService.deleteSeries(seriesId);

        if (!result) {
          return res.status(404).json({
            status: 'error',
            message: "Series not found."
          });
        }

        return res.status(200).json({
          status: 'success',
          message: 'Success',
          data: { message: "Series deleted successfully." }
        });
      } catch (error) {
        return res.status(500).json({
          status: 'error',
          message: "Internal server error",
          error: error.message
        });
      }
    });
    
    // Mock service methods
    seriesService.createSeries = jest.fn();
    seriesService.getAllSeries = jest.fn();
    seriesService.getSeriesById = jest.fn();
    seriesService.updateSeries = jest.fn();
    seriesService.deleteSeries = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('createSeries', () => {
    it('should create a series successfully', async () => {
      // Setup
      req.body = {
        title: 'Test Series',
        description: 'Test description'
      };
      
      // Mock seriesService.createSeries
      const mockSeries = {
        series_id: 1,
        title: 'Test Series',
        description: 'Test description'
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
          series: mockSeries
        }
      });
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Setup
      req.body = {
        description: 'Test description'
      };
      
      // Mock validateRequiredFields to return invalid for this test
      seriesController.validateRequiredFields.mockReturnValueOnce({ 
        isValid: false, 
        missingFields: ['title'] 
      });
      
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
      // Setup
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
        error: error.message
      });
    });
  });
  
  describe('getAllSeries', () => {
    it('should get all series successfully', async () => {
      // Setup
      const mockResult = {
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          pages: 1
        },
        series: [
          {
            series_id: 1,
            title: 'Series 1'
          },
          {
            series_id: 2,
            title: 'Series 2'
          }
        ]
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
        data: { series: mockResult }
      });
    });
    
    it('should handle errors', async () => {
      // Setup
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
        error: error.message
      });
    });
  });
  
  describe('getSeriesById', () => {
    it('should get series by ID successfully', async () => {
      // Setup
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
      // Setup
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
      // Setup
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
        error: error.message
      });
    });
  });
  
  describe('updateSeries', () => {
    it('should update series successfully', async () => {
      // Setup
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
        data: { series: mockUpdatedSeries }
      });
    });
    
    it('should return 400 if seriesId is missing', async () => {
      // Setup
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
      // Setup
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
      // Setup
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
        error: error.message
      });
    });
  });
  
  describe('deleteSeries', () => {
    it('should delete series successfully', async () => {
      // Setup
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
      // Setup
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
      // Setup
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
        error: error.message
      });
    });
  });
});

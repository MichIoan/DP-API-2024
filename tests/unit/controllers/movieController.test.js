/**
 * Unit tests for the Movie Controller
 */
const movieController = require('../../../src/controllers/movieController');
const mediaService = require('../../../src/services/mediaService');

// Mock dependencies
jest.mock('../../../src/services/mediaService');

describe('MovieController', () => {
  let req;
  let res;
  
  beforeEach(() => {
    // Mock request and response objects
    req = {
      params: {},
      body: {},
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock controller methods
    movieController.handleSuccess = jest.fn();
    movieController.handleError = jest.fn();
    movieController.validateRequiredFields = jest.fn().mockReturnValue({ isValid: true });
    movieController.convertParams = jest.fn().mockImplementation((params, types) => params);
    
    // Clear all mocks
    jest.clearAllMocks();
  });
  
  describe('createMovie', () => {
    it('should create a movie successfully', async () => {
      // Mock request body
      req.body = {
        title: 'Test Movie',
        duration: '02:30:00',
        release_date: '2023-01-01',
        description: 'Test description'
      };
      
      // Mock validation
      movieController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock mediaService.createMovie
      const mockMovie = {
        media_id: 1,
        title: 'Test Movie',
        duration: '02:30:00',
        release_date: '2023-01-01',
        description: 'Test description',
        media_type: 'movie'
      };
      mediaService.createMovie.mockResolvedValue(mockMovie);
      
      // Call the method
      await movieController.createMovie(req, res);
      
      // Assertions
      expect(movieController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['title', 'duration']
      );
      expect(mediaService.createMovie).toHaveBeenCalledWith(req.body);
      expect(movieController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        201, 
        {
          message: "Movie added successfully.",
          movie: mockMovie
        }
      );
      expect(movieController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if required fields are missing', async () => {
      // Mock request body with missing fields
      req.body = {
        title: 'Test Movie'
        // Missing duration
      };
      
      // Mock validation to fail
      movieController.validateRequiredFields.mockReturnValue({ 
        isValid: false,
        missingFields: ['duration']
      });
      
      // Call the method
      await movieController.createMovie(req, res);
      
      // Assertions
      expect(movieController.validateRequiredFields).toHaveBeenCalledWith(
        req.body, 
        ['title', 'duration']
      );
      expect(mediaService.createMovie).not.toHaveBeenCalled();
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide at least a title and a duration for the movie."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 409 if movie with same title already exists', async () => {
      // Mock request body
      req.body = {
        title: 'Existing Movie',
        duration: '02:00:00'
      };
      
      // Mock validation
      movieController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock mediaService.createMovie to throw unique constraint error
      const error = new Error('Duplicate movie');
      error.name = 'SequelizeUniqueConstraintError';
      mediaService.createMovie.mockRejectedValue(error);
      
      // Call the method
      await movieController.createMovie(req, res);
      
      // Assertions
      expect(mediaService.createMovie).toHaveBeenCalledWith(req.body);
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        409, 
        "A movie with this title already exists."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 422 if validation error occurs', async () => {
      // Mock request body
      req.body = {
        title: 'Test Movie',
        duration: 'invalid duration'
      };
      
      // Mock validation
      movieController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock mediaService.createMovie to throw validation error
      const error = new Error('Validation error');
      error.name = 'SequelizeValidationError';
      mediaService.createMovie.mockRejectedValue(error);
      
      // Call the method
      await movieController.createMovie(req, res);
      
      // Assertions
      expect(mediaService.createMovie).toHaveBeenCalledWith(req.body);
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        422, 
        "Invalid movie data provided.",
        error.message
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 500 for general errors', async () => {
      // Mock request body
      req.body = {
        title: 'Test Movie',
        duration: '02:00:00'
      };
      
      // Mock validation
      movieController.validateRequiredFields.mockReturnValue({ isValid: true });
      
      // Mock mediaService.createMovie to throw general error
      const error = new Error('Database error');
      mediaService.createMovie.mockRejectedValue(error);
      
      // Call the method
      await movieController.createMovie(req, res);
      
      // Assertions
      expect(mediaService.createMovie).toHaveBeenCalledWith(req.body);
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Internal server error",
        error.message
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('deleteMovie', () => {
    it('should delete a movie successfully', async () => {
      // Mock request parameters
      req.params = {
        movieId: '1'
      };
      
      // Mock mediaService.deleteMovie
      mediaService.deleteMovie.mockResolvedValue(true);
      
      // Call the method
      await movieController.deleteMovie(req, res);
      
      // Assertions
      expect(mediaService.deleteMovie).toHaveBeenCalledWith('1');
      expect(movieController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        204, 
        { message: "Movie deleted successfully." }
      );
      expect(movieController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if movie ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await movieController.deleteMovie(req, res);
      
      // Assertions
      expect(mediaService.deleteMovie).not.toHaveBeenCalled();
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide a movieId to delete."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if movie is not found', async () => {
      // Mock request parameters
      req.params = {
        movieId: '999'
      };
      
      // Mock mediaService.deleteMovie to return false (not found)
      mediaService.deleteMovie.mockResolvedValue(false);
      
      // Call the method
      await movieController.deleteMovie(req, res);
      
      // Assertions
      expect(mediaService.deleteMovie).toHaveBeenCalledWith('999');
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Movie not found."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle foreign key constraint errors', async () => {
      // Mock request parameters
      req.params = {
        movieId: '1'
      };
      
      // Mock mediaService.deleteMovie to throw foreign key constraint error
      const error = new Error('Cannot delete or update a parent row: a foreign key constraint fails');
      mediaService.deleteMovie.mockRejectedValue(error);
      
      // Call the method
      await movieController.deleteMovie(req, res);
      
      // Assertions
      expect(mediaService.deleteMovie).toHaveBeenCalledWith('1');
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        409, 
        "Cannot delete movie as it is referenced by other records."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 500 for general errors', async () => {
      // Mock request parameters
      req.params = {
        movieId: '1'
      };
      
      // Mock mediaService.deleteMovie to throw general error
      const error = new Error('Database error');
      mediaService.deleteMovie.mockRejectedValue(error);
      
      // Call the method
      await movieController.deleteMovie(req, res);
      
      // Assertions
      expect(mediaService.deleteMovie).toHaveBeenCalledWith('1');
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Internal server error",
        error.message
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getMovieById', () => {
    it('should get a movie by ID successfully', async () => {
      // Mock request parameters
      req.params = {
        movieId: '1'
      };
      
      // Mock mediaService.getMovieById
      const mockMovie = {
        media_id: 1,
        title: 'Test Movie',
        media_type: 'movie'
      };
      mediaService.getMovieById.mockResolvedValue(mockMovie);
      
      // Call the method
      await movieController.getMovieById(req, res);
      
      // Assertions
      expect(mediaService.getMovieById).toHaveBeenCalledWith('1');
      expect(movieController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        { movie: mockMovie }
      );
      expect(movieController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if movie ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      
      // Call the method
      await movieController.getMovieById(req, res);
      
      // Assertions
      expect(mediaService.getMovieById).not.toHaveBeenCalled();
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide a movieId to retrieve."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if movie is not found', async () => {
      // Mock request parameters
      req.params = {
        movieId: '999'
      };
      
      // Mock mediaService.getMovieById to return null (not found)
      mediaService.getMovieById.mockResolvedValue(null);
      
      // Call the method
      await movieController.getMovieById(req, res);
      
      // Assertions
      expect(mediaService.getMovieById).toHaveBeenCalledWith('999');
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Movie not found."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should handle invalid ID format errors', async () => {
      // Mock request parameters
      req.params = {
        movieId: 'invalid'
      };
      
      // Mock mediaService.getMovieById to throw invalid input syntax error
      const error = new Error('invalid input syntax');
      error.name = 'SequelizeDatabaseError';
      mediaService.getMovieById.mockRejectedValue(error);
      
      // Call the method
      await movieController.getMovieById(req, res);
      
      // Assertions
      expect(mediaService.getMovieById).toHaveBeenCalledWith('invalid');
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Invalid movie ID format."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 500 for general errors', async () => {
      // Mock request parameters
      req.params = {
        movieId: '1'
      };
      
      // Mock mediaService.getMovieById to throw general error
      const error = new Error('Database error');
      mediaService.getMovieById.mockRejectedValue(error);
      
      // Call the method
      await movieController.getMovieById(req, res);
      
      // Assertions
      expect(mediaService.getMovieById).toHaveBeenCalledWith('1');
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Internal server error",
        error.message
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('getMovies', () => {
    it('should get movies successfully', async () => {
      // Mock query parameters
      req.query = {
        page: '1',
        limit: '10',
        genre: 'Action'
      };
      
      // Mock convertParams
      movieController.convertParams.mockReturnValue({
        page: 1,
        limit: 10,
        genre: 'Action'
      });
      
      // Mock mediaService.getMovies
      const mockResult = {
        movies: [
          { media_id: 1, title: 'Movie 1', media_type: 'movie' },
          { media_id: 2, title: 'Movie 2', media_type: 'movie' }
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10
        }
      };
      mediaService.getMovies.mockResolvedValue(mockResult);
      
      // Call the method
      await movieController.getMovies(req, res);
      
      // Assertions
      expect(movieController.convertParams).toHaveBeenCalledWith(
        req.query,
        {
          page: 'number',
          limit: 'number',
          genre: 'string',
          classification: 'string'
        }
      );
      expect(mediaService.getMovies).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        genre: 'Action'
      });
      expect(movieController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        mockResult
      );
      expect(movieController.handleError).not.toHaveBeenCalled();
    });
    
    it('should handle invalid parameter errors', async () => {
      // Mock query parameters
      req.query = {
        page: 'invalid'
      };
      
      // Mock mediaService.getMovies to throw invalid parameter error
      const error = new Error('invalid parameter');
      mediaService.getMovies.mockRejectedValue(error);
      
      // Call the method
      await movieController.getMovies(req, res);
      
      // Assertions
      expect(mediaService.getMovies).toHaveBeenCalled();
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Invalid query parameters.",
        error.message
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 500 for general errors', async () => {
      // Mock mediaService.getMovies to throw general error
      const error = new Error('Database error');
      mediaService.getMovies.mockRejectedValue(error);
      
      // Call the method
      await movieController.getMovies(req, res);
      
      // Assertions
      expect(mediaService.getMovies).toHaveBeenCalled();
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Internal server error",
        error.message
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
  });
  
  describe('updateMovie', () => {
    it('should update a movie successfully', async () => {
      // Mock request parameters and body
      req.params = {
        movieId: '1'
      };
      req.body = {
        title: 'Updated Movie',
        duration: '02:15:00'
      };
      
      // Mock mediaService.updateMovie
      const mockUpdatedMovie = {
        media_id: 1,
        title: 'Updated Movie',
        duration: '02:15:00',
        media_type: 'movie'
      };
      mediaService.updateMovie.mockResolvedValue(mockUpdatedMovie);
      
      // Call the method
      await movieController.updateMovie(req, res);
      
      // Assertions
      expect(mediaService.updateMovie).toHaveBeenCalledWith('1', req.body);
      expect(movieController.handleSuccess).toHaveBeenCalledWith(
        req, 
        res, 
        200, 
        {
          message: "Movie updated successfully.",
          movie: mockUpdatedMovie
        }
      );
      expect(movieController.handleError).not.toHaveBeenCalled();
    });
    
    it('should return 400 if movie ID is missing', async () => {
      // Empty request parameters
      req.params = {};
      req.body = {
        title: 'Updated Movie'
      };
      
      // Call the method
      await movieController.updateMovie(req, res);
      
      // Assertions
      expect(mediaService.updateMovie).not.toHaveBeenCalled();
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        400, 
        "Please provide a movieId to update."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 404 if movie is not found', async () => {
      // Mock request parameters and body
      req.params = {
        movieId: '999'
      };
      req.body = {
        title: 'Updated Movie'
      };
      
      // Mock mediaService.updateMovie to return null (not found)
      mediaService.updateMovie.mockResolvedValue(null);
      
      // Call the method
      await movieController.updateMovie(req, res);
      
      // Assertions
      expect(mediaService.updateMovie).toHaveBeenCalledWith('999', req.body);
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        404, 
        "Movie not found."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 409 if updated title already exists', async () => {
      // Mock request parameters and body
      req.params = {
        movieId: '1'
      };
      req.body = {
        title: 'Existing Movie'
      };
      
      // Mock mediaService.updateMovie to throw unique constraint error
      const error = new Error('Duplicate movie');
      error.name = 'SequelizeUniqueConstraintError';
      mediaService.updateMovie.mockRejectedValue(error);
      
      // Call the method
      await movieController.updateMovie(req, res);
      
      // Assertions
      expect(mediaService.updateMovie).toHaveBeenCalledWith('1', req.body);
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        409, 
        "A movie with this title already exists."
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 422 if validation error occurs', async () => {
      // Mock request parameters and body
      req.params = {
        movieId: '1'
      };
      req.body = {
        duration: 'invalid duration'
      };
      
      // Mock mediaService.updateMovie to throw validation error
      const error = new Error('Validation error');
      error.name = 'SequelizeValidationError';
      mediaService.updateMovie.mockRejectedValue(error);
      
      // Call the method
      await movieController.updateMovie(req, res);
      
      // Assertions
      expect(mediaService.updateMovie).toHaveBeenCalledWith('1', req.body);
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        422, 
        "Invalid movie data provided.",
        error.message
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
    
    it('should return 500 for general errors', async () => {
      // Mock request parameters and body
      req.params = {
        movieId: '1'
      };
      req.body = {
        title: 'Updated Movie'
      };
      
      // Mock mediaService.updateMovie to throw general error
      const error = new Error('Database error');
      mediaService.updateMovie.mockRejectedValue(error);
      
      // Call the method
      await movieController.updateMovie(req, res);
      
      // Assertions
      expect(mediaService.updateMovie).toHaveBeenCalledWith('1', req.body);
      expect(movieController.handleError).toHaveBeenCalledWith(
        req, 
        res, 
        500, 
        "Internal server error",
        error.message
      );
      expect(movieController.handleSuccess).not.toHaveBeenCalled();
    });
  });
});

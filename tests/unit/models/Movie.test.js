const { Movie } = require('../../../src/models/Movie');

describe('Movie Model', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByPk', () => {
    it('should return a movie when given a valid ID', async () => {
      const movie = await Movie.findByPk(1);
      
      expect(Movie.findByPk).toHaveBeenCalledWith(1);
      expect(movie).toEqual({
        movie_id: 1,
        title: 'Test Movie',
        description: 'A test movie for testing',
        genre: 'Action',
        release_year: 2023,
        duration: 120,
        rating: 'PG-13',
        director: 'Test Director',
        cast: ['Actor 1', 'Actor 2'],
        poster_url: 'https://example.com/poster.jpg',
        trailer_url: 'https://example.com/trailer.mp4'
      });
    });

    it('should be able to mock a different return value', async () => {
      // Override the mock for this specific test
      Movie.findByPk.mockResolvedValueOnce({
        movie_id: 2,
        title: 'Another Movie',
        description: 'Another test movie',
        genre: 'Comedy',
        release_year: 2022,
        duration: 95,
        rating: 'PG',
        director: 'Another Director',
        cast: ['Actor 3', 'Actor 4'],
        poster_url: 'https://example.com/another-poster.jpg',
        trailer_url: 'https://example.com/another-trailer.mp4'
      });
      
      const movie = await Movie.findByPk(2);
      
      expect(Movie.findByPk).toHaveBeenCalledWith(2);
      expect(movie.title).toBe('Another Movie');
      expect(movie.genre).toBe('Comedy');
    });
  });

  describe('findAll', () => {
    it('should return an empty array by default', async () => {
      const movies = await Movie.findAll();
      
      expect(Movie.findAll).toHaveBeenCalled();
      expect(movies).toEqual([]);
    });

    it('should be able to mock a list of movies', async () => {
      // Override the mock for this specific test
      Movie.findAll.mockResolvedValueOnce([
        {
          movie_id: 1,
          title: 'Movie 1',
          genre: 'Action'
        },
        {
          movie_id: 2,
          title: 'Movie 2',
          genre: 'Comedy'
        }
      ]);
      
      const movies = await Movie.findAll();
      
      expect(Movie.findAll).toHaveBeenCalled();
      expect(movies).toHaveLength(2);
      expect(movies[0].title).toBe('Movie 1');
      expect(movies[1].title).toBe('Movie 2');
    });
  });

  describe('create', () => {
    it('should call create with the provided movie data', async () => {
      const movieData = {
        title: 'New Movie',
        description: 'A new movie',
        genre: 'Sci-Fi',
        release_year: 2024
      };
      
      await Movie.create(movieData);
      
      expect(Movie.create).toHaveBeenCalledWith(movieData);
    });

    it('should be able to mock a created movie', async () => {
      const movieData = {
        title: 'New Movie',
        genre: 'Sci-Fi'
      };
      
      // Override the mock for this specific test
      Movie.create.mockResolvedValueOnce({
        movie_id: 3,
        ...movieData,
        created_at: new Date()
      });
      
      const createdMovie = await Movie.create(movieData);
      
      expect(Movie.create).toHaveBeenCalledWith(movieData);
      expect(createdMovie.movie_id).toBe(3);
      expect(createdMovie.title).toBe('New Movie');
    });
  });

  describe('update', () => {
    it('should call update with the provided movie data and options', async () => {
      const movieData = {
        title: 'Updated Movie',
        description: 'An updated movie'
      };
      
      const options = {
        where: { movie_id: 1 }
      };
      
      await Movie.update(movieData, options);
      
      expect(Movie.update).toHaveBeenCalledWith(movieData, options);
    });
  });

  describe('destroy', () => {
    it('should call destroy with the provided options', async () => {
      const options = {
        where: { movie_id: 1 }
      };
      
      await Movie.destroy(options);
      
      expect(Movie.destroy).toHaveBeenCalledWith(options);
    });
  });
});

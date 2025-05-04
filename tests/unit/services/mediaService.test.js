const mediaService = require('../../../src/services/mediaService');
const DbUtils = require('../../../src/utils/dbUtils');
const sequelize = require('../../../src/config/sequelize');

// Mock models
jest.mock('../../../src/models/Media', () => ({
  Media: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
}));

jest.mock('../../../src/models/Genre', () => ({
  Genre: {
    findAll: jest.fn(),
    findOrCreate: jest.fn()
  }
}));

jest.mock('../../../src/models/Season', () => ({
  Season: {}
}));

jest.mock('../../../src/models/Series', () => ({
  Series: {}
}));

jest.mock('../../../src/models/WatchHistory', () => ({
  WatchHistory: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

jest.mock('../../../src/models/WatchList', () => ({
  WatchList: {
    findOne: jest.fn(),
    create: jest.fn()
  }
}));

// Mock other dependencies
jest.mock('../../../src/utils/dbUtils');
jest.mock('../../../src/config/sequelize');

// Import the mocked models
const { Media } = require('../../../src/models/Media');
const { Genre } = require('../../../src/models/Genre');
const { Season } = require('../../../src/models/Season');
const { Series } = require('../../../src/models/Series');
const { WatchHistory } = require('../../../src/models/WatchHistory');
const { WatchList } = require('../../../src/models/WatchList');

describe('MediaService', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock sequelize transaction
    sequelize.transaction = jest.fn().mockImplementation(() => ({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined)
    }));
  });

  describe('getAllMedia', () => {
    it('should get all media with default options', async () => {
      // Mock data
      const mockMedia = [
        { id: 1, title: 'Movie 1', type: 'movie' },
        { id: 2, title: 'Series 1', type: 'series' }
      ];
      
      // Mock Media.findAndCountAll
      Media.findAndCountAll = jest.fn().mockResolvedValue({
        count: 2,
        rows: mockMedia
      });
      
      // Call the method
      const result = await mediaService.getAllMedia();
      
      // Assertions
      expect(Media.findAndCountAll).toHaveBeenCalledWith({
        where: {},
        limit: 20,
        offset: 0,
        include: [{ model: Genre }]
      });
      expect(result).toEqual({
        media: mockMedia,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1
        }
      });
    });
    
    it('should apply filters when provided', async () => {
      // Mock data
      const options = {
        page: 2,
        limit: 10,
        genre: 'Action',
        type: 'movie',
        classification: 'PG'
      };
      
      const mockMedia = [
        { id: 3, title: 'Action Movie 1', type: 'movie', content_classification: 'PG' },
        { id: 4, title: 'Action Movie 2', type: 'movie', content_classification: 'PG' }
      ];
      
      // Mock Media.findAndCountAll
      Media.findAndCountAll.mockResolvedValue({
        count: 15,
        rows: mockMedia
      });
      
      // Call the method
      const result = await mediaService.getAllMedia(options);
      
      // Assertions
      expect(Media.findAndCountAll).toHaveBeenCalledWith({
        where: {
          type: 'movie',
          content_classification: 'PG'
        },
        limit: 10,
        offset: 10, // (page 2 - 1) * limit 10
        include: [
          { model: Genre, where: { name: 'Action' } }
        ]
      });
      expect(result).toEqual({
        media: mockMedia,
        pagination: {
          total: 15,
          page: 2,
          limit: 10,
          pages: 2
        }
      });
    });
    
    it('should handle errors', async () => {
      // Mock Media.findAndCountAll to throw an error
      const error = new Error('Database error');
      Media.findAndCountAll.mockRejectedValue(error);
      
      // Mock console.error
      console.error = jest.fn();
      
      // Call the method and expect it to throw
      await expect(mediaService.getAllMedia()).rejects.toThrow('Database error');
      
      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error getting media:', error);
    });
  });

  describe('getMediaById', () => {
    it('should get media by ID with related data', async () => {
      // Mock data
      const mediaId = 1;
      const mockMedia = {
        id: mediaId,
        title: 'Test Media',
        type: 'movie',
        Genres: [{ id: 1, name: 'Action' }],
        Seasons: []
      };
      
      // Mock Media.findByPk
      Media.findByPk = jest.fn().mockResolvedValue(mockMedia);
      
      // Call the method
      const result = await mediaService.getMediaById(mediaId);
      
      // Assertions
      expect(Media.findByPk).toHaveBeenCalledWith(mediaId, expect.any(Object));
      expect(result).toEqual(mockMedia);
    });
    
    it('should throw an error if media not found', async () => {
      // Mock Media.findByPk to return null
      Media.findByPk = jest.fn().mockResolvedValue(null);
      
      // Mock console.error
      console.error = jest.fn();
      
      // Call the method and expect it to throw
      await expect(mediaService.getMediaById(999)).rejects.toThrow('Media not found');
      
      // Assertions
      expect(Media.findByPk).toHaveBeenCalledWith(999, expect.any(Object));
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('addToWatchList', () => {
    it('should add media to watch list', async () => {
      // Mock data
      const profileId = 1;
      const mediaId = 2;
      const mockWatchListEntry = {
        profile_id: profileId,
        media_id: mediaId,
        created_at: new Date()
      };
      
      // Mock DbUtils.callProcedure
      DbUtils.callProcedure = jest.fn().mockResolvedValue(undefined);
      
      // Mock WatchList.findOne
      WatchList.findOne = jest.fn().mockResolvedValue(mockWatchListEntry);
      
      // Call the method
      const result = await mediaService.addToWatchList(profileId, mediaId);
      
      // Assertions
      expect(DbUtils.callProcedure).toHaveBeenCalledWith('AddToWatchList', [profileId, mediaId]);
      expect(WatchList.findOne).toHaveBeenCalledWith({
        where: {
          profile_id: profileId,
          media_id: mediaId
        },
        order: [['created_at', 'DESC']]
      });
      expect(result).toEqual(mockWatchListEntry);
    });
    
    it('should handle errors', async () => {
      // Mock DbUtils.callProcedure to throw an error
      const error = new Error('Database error');
      DbUtils.callProcedure = jest.fn().mockRejectedValue(error);
      
      // Mock console.error
      console.error = jest.fn();
      
      // Call the method and expect it to throw
      await expect(mediaService.addToWatchList(1, 2)).rejects.toThrow('Database error');
      
      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error adding to watch list:', error);
    });
  });

  describe('markAsWatched', () => {
    it('should mark media as watched with default progress', async () => {
      // Mock data
      const profileId = 1;
      const mediaId = 2;
      const mockWatchHistoryEntry = {
        profile_id: profileId,
        media_id: mediaId,
        progress: 100,
        watched_at: new Date()
      };
      
      // Mock DbUtils.callProcedure
      DbUtils.callProcedure = jest.fn().mockResolvedValue(undefined);
      
      // Mock WatchHistory.findOne
      WatchHistory.findOne = jest.fn().mockResolvedValue(mockWatchHistoryEntry);
      
      // Call the method
      const result = await mediaService.markAsWatched(profileId, mediaId);
      
      // Assertions
      expect(DbUtils.callProcedure).toHaveBeenCalledWith('MarkAsWatched', [profileId, mediaId, 100]);
      expect(WatchHistory.findOne).toHaveBeenCalledWith({
        where: {
          profile_id: profileId,
          media_id: mediaId
        },
        order: [['watched_at', 'DESC']]
      });
      expect(result).toEqual(mockWatchHistoryEntry);
    });
    
    it('should mark media as watched with custom progress', async () => {
      // Mock data
      const profileId = 1;
      const mediaId = 2;
      const progress = 75;
      const mockWatchHistoryEntry = {
        profile_id: profileId,
        media_id: mediaId,
        progress: progress,
        watched_at: new Date()
      };
      
      // Mock DbUtils.callProcedure
      DbUtils.callProcedure = jest.fn().mockResolvedValue(undefined);
      
      // Mock WatchHistory.findOne
      WatchHistory.findOne = jest.fn().mockResolvedValue(mockWatchHistoryEntry);
      
      // Call the method
      const result = await mediaService.markAsWatched(profileId, mediaId, progress);
      
      // Assertions
      expect(DbUtils.callProcedure).toHaveBeenCalledWith('MarkAsWatched', [profileId, mediaId, progress]);
      expect(result).toEqual(mockWatchHistoryEntry);
    });
    
    it('should handle errors', async () => {
      // Mock DbUtils.callProcedure to throw an error
      const error = new Error('Database error');
      DbUtils.callProcedure = jest.fn().mockRejectedValue(error);
      
      // Mock console.error
      console.error = jest.fn();
      
      // Call the method and expect it to throw
      await expect(mediaService.markAsWatched(1, 2)).rejects.toThrow('Database error');
      
      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error marking as watched:', error);
    });
  });



  describe('createMovie', () => {
    it('should create a movie with genres', async () => {
      // Mock data
      const movieData = {
        title: 'Test Movie',
        description: 'A test movie',
        release_year: 2023,
        duration: 120,
        genres: ['Action', 'Thriller']
      };

      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);

      // Mock Genre.findOrCreate
      const mockGenres = [
        [{ id: 1, name: 'Action' }, true],
        [{ id: 2, name: 'Thriller' }, true]
      ];
      Genre.findOrCreate
        .mockResolvedValueOnce(mockGenres[0])
        .mockResolvedValueOnce(mockGenres[1]);

      // Mock Media.create
      const mockMovie = {
        id: 1,
        title: movieData.title,
        description: movieData.description,
        release_year: movieData.release_year,
        duration: movieData.duration,
        type: 'movie',
        addGenres: jest.fn().mockResolvedValue(undefined)
      };
      Media.create.mockResolvedValue(mockMovie);

      // Mock Media.findByPk for the final return
      const mockMovieWithGenres = {
        ...mockMovie,
        Genres: [mockGenres[0][0], mockGenres[1][0]]
      };
      Media.findByPk.mockResolvedValue(mockMovieWithGenres);

      // Call the method
      const result = await mediaService.createMovie(movieData);

      // Assertions
      expect(Media.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: movieData.title,
          description: movieData.description,
          type: 'movie'
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      
      expect(Genre.findOrCreate).toHaveBeenCalledTimes(2);
      expect(mockMovie.addGenres).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 1 }), expect.objectContaining({ id: 2 })]),
        expect.objectContaining({ transaction: mockTransaction })
      );
      
      expect(Media.findByPk).toHaveBeenCalledWith(mockMovie.id, 
        expect.objectContaining({
          include: expect.arrayContaining([expect.anything()])
        })
      );
      
      expect(result).toEqual(mockMovieWithGenres);
    });

    it('should create a movie without genres', async () => {
      // Mock data
      const movieData = {
        title: 'New Movie',
        description: 'A new movie description',
        release_year: 2023,
        duration: 120
      };

      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);

      // Mock Media.create
      const mockMovie = {
        id: 1,
        ...movieData,
        type: 'movie',
        addGenres: jest.fn().mockResolvedValue(undefined)
      };
      Media.create.mockResolvedValue(mockMovie);

      // Mock Media.findByPk for the final return
      const mockMovieWithGenres = {
        ...mockMovie,
        Genres: []
      };
      Media.findByPk.mockResolvedValue(mockMovieWithGenres);

      // Call the method
      const result = await mediaService.createMovie(movieData);

      // Assertions
      expect(Media.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: movieData.title,
          description: movieData.description,
          type: 'movie'
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      
      // Should not call findOrCreate or addGenres
      expect(Genre.findOrCreate).not.toHaveBeenCalled();
      expect(mockMovie.addGenres).not.toHaveBeenCalled();
      
      expect(Media.findByPk).toHaveBeenCalledWith(mockMovie.id, 
        expect.objectContaining({
          include: expect.arrayContaining([expect.anything()])
        })
      );
      
      expect(result).toEqual(mockMovieWithGenres);
    });

    it('should handle errors and rollback transaction', async () => {
      // Mock data
      const movieData = {
        title: 'Error Movie',
        description: 'A movie that will cause an error'
      };
      
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock error
      const error = new Error('Database error');
      Media.create.mockRejectedValue(error);
      
      // Mock console.error
      console.error = jest.fn();
      
      // Call the method and expect it to throw
      await expect(mediaService.createMovie(movieData)).rejects.toThrow('Database error');
      
      // Assertions
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error creating movie:', error);
    });
  });

  describe('getMovieById', () => {
    it('should get a movie by ID', async () => {
      // Mock data
      const movieId = 1;
      const mockMovie = {
        id: movieId,
        title: 'Test Movie',
        type: 'movie',
        Genres: [{ id: 1, name: 'Action' }]
      };
      
      // Mock Media.findOne
      Media.findOne.mockResolvedValue(mockMovie);
      
      // Call the method
      const result = await mediaService.getMovieById(movieId);
      
      // Assertions
      expect(Media.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: movieId, type: 'movie' },
          include: [expect.objectContaining({ model: Genre })]
        })
      );
      expect(result).toEqual(mockMovie);
    });

    it('should return null if movie not found', async () => {
      // Mock Media.findOne to return null
      Media.findOne.mockResolvedValue(null);
      
      // Call the method
      const result = await mediaService.getMovieById(999);
      
      // Assertions
      expect(result).toBeNull();
    });
    
    it('should handle errors', async () => {
      // Mock error
      const error = new Error('Database error');
      Media.findOne.mockRejectedValue(error);
      
      // Mock console.error
      console.error = jest.fn();
      
      // Call the method and expect it to throw
      await expect(mediaService.getMovieById(999)).rejects.toThrow('Database error');
      
      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error getting movie by ID:', error);
    });
  });

  describe('deleteMovie', () => {
    it('should delete a movie', async () => {
      // Mock data
      const movieId = 1;
      const mockMovie = {
        id: movieId,
        title: 'Test Movie',
        type: 'movie',
        destroy: jest.fn().mockResolvedValue(undefined),
        setGenres: jest.fn().mockResolvedValue(undefined)
      };
      
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock Media.findOne
      Media.findOne.mockResolvedValue(mockMovie);
      
      // Call the method
      const result = await mediaService.deleteMovie(movieId);
      
      // Assertions
      expect(Media.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: movieId, type: 'movie' },
          transaction: mockTransaction
        })
      );
      expect(mockMovie.setGenres).toHaveBeenCalledWith([], { transaction: mockTransaction });
      expect(mockMovie.destroy).toHaveBeenCalledWith({ transaction: mockTransaction });
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if movie not found', async () => {
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock Media.findOne to return null
      Media.findOne.mockResolvedValue(null);
      
      // Call the method
      const result = await mediaService.deleteMovie(999);
      
      // Assertions
      expect(Media.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 999, type: 'movie' }
        })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle errors and rollback transaction', async () => {
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock data
      const movieId = 1;
      const error = new Error('Database error');
      
      // Mock Media.findOne to throw an error
      Media.findOne.mockRejectedValue(error);
      
      // Mock console.error
      console.error = jest.fn();
      
      // Call the method and expect it to throw
      await expect(mediaService.deleteMovie(movieId)).rejects.toThrow('Database error');
      
      // Assertions
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error deleting movie:', error);
    });
  });

  describe('updateMovie', () => {
    it('should update a movie with genres', async () => {
      // Mock data
      const movieId = 1;
      const movieData = {
        title: 'Updated Movie',
        description: 'Updated description',
        genres: ['Comedy', 'Drama']
      };
      
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock Media.findOne
      const mockMovie = {
        id: movieId,
        title: 'Original Movie',
        description: 'Original description',
        type: 'movie',
        update: jest.fn().mockResolvedValue(undefined),
        setGenres: jest.fn().mockResolvedValue(undefined)
      };
      Media.findOne.mockResolvedValue(mockMovie);
      
      // Mock Genre.findOrCreate
      const mockGenres = [
        [{ id: 3, name: 'Comedy' }, true],
        [{ id: 4, name: 'Drama' }, true]
      ];
      Genre.findOrCreate
        .mockResolvedValueOnce(mockGenres[0])
        .mockResolvedValueOnce(mockGenres[1]);
      
      // Mock Media.findByPk for the final return
      const mockUpdatedMovie = {
        ...mockMovie,
        title: movieData.title,
        description: movieData.description,
        Genres: [mockGenres[0][0], mockGenres[1][0]]
      };
      Media.findByPk.mockResolvedValue(mockUpdatedMovie);
      
      // Call the method
      const result = await mediaService.updateMovie(movieId, movieData);
      
      // Assertions
      expect(Media.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: movieId, type: 'movie' }
        })
      );
      
      expect(mockMovie.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: movieData.title,
          description: movieData.description
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      
      expect(Genre.findOrCreate).toHaveBeenCalledTimes(2);
      expect(mockMovie.setGenres).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: 3 }), expect.objectContaining({ id: 4 })]),
        expect.objectContaining({ transaction: mockTransaction })
      );
      
      expect(Media.findByPk).toHaveBeenCalledWith(movieId, 
        expect.objectContaining({
          include: expect.arrayContaining([expect.anything()])
        })
      );
      
      expect(result).toEqual(mockUpdatedMovie);
    });

    it('should update a movie without genres', async () => {
      // Mock data
      const movieId = 1;
      const movieData = {
        title: 'Updated Movie',
        description: 'Updated description'
      };
      
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock Media.findOne
      const mockMovie = {
        id: movieId,
        title: 'Original Movie',
        description: 'Original description',
        type: 'movie',
        update: jest.fn().mockResolvedValue(undefined),
        setGenres: jest.fn().mockResolvedValue(undefined)
      };
      Media.findOne.mockResolvedValue(mockMovie);
      
      // Mock Media.findByPk for the final return
      const mockUpdatedMovie = {
        ...mockMovie,
        title: movieData.title,
        description: movieData.description,
        Genres: []
      };
      Media.findByPk.mockResolvedValue(mockUpdatedMovie);
      
      // Call the method
      const result = await mediaService.updateMovie(movieId, movieData);
      
      // Assertions
      expect(mockMovie.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: movieData.title,
          description: movieData.description
        }),
        expect.objectContaining({ transaction: mockTransaction })
      );
      
      expect(Genre.findOrCreate).not.toHaveBeenCalled();
      expect(mockMovie.setGenres).not.toHaveBeenCalled();
      
      expect(result).toEqual(mockUpdatedMovie);
    });

    it('should return null if movie not found', async () => {
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock Media.findOne to return null
      Media.findOne.mockResolvedValue(null);
      
      // Call the method
      const result = await mediaService.updateMovie(999, { title: 'Updated' });
      
      // Assertions
      expect(Media.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 999, type: 'movie' }
        })
      );
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should handle errors and rollback transaction', async () => {
      // Mock transaction
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
      
      // Mock data
      const movieId = 1;
      const error = new Error('Database error');
      
      // Mock Media.findOne to throw an error
      Media.findOne.mockRejectedValue(error);
      
      // Mock console.error
      console.error = jest.fn();
      
      // Call the method and expect it to throw
      await expect(mediaService.updateMovie(movieId, { title: 'Updated' }))
        .rejects.toThrow('Database error');
      
      // Assertions
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Error updating movie:', error);
    });
  });

  describe('getMovies', () => {
    it('should get all movies with default options', async () => {
      // Mock data
      const mockMovies = [
        { id: 1, title: 'Movie 1', type: 'movie' },
        { id: 2, title: 'Movie 2', type: 'movie' }
      ];
      
      // Mock Media.findAndCountAll
      Media.findAndCountAll.mockResolvedValue({
        count: 2,
        rows: mockMovies
      });
      
      // Call the method
      const result = await mediaService.getMovies();
      
      // Assertions
      expect(Media.findAndCountAll).toHaveBeenCalledWith({
        where: { type: 'movie' },
        limit: 20,
        offset: 0,
        include: [{ model: Genre }]
      });
      expect(result).toEqual({
        movies: mockMovies,
        pagination: expect.objectContaining({
          total: 2,
          page: 1,
          limit: 20
        })
      });
    });

    it('should apply filters when provided', async () => {
      // Mock data
      const options = {
        page: 2,
        limit: 10,
        genre: 'Comedy',
        classification: 'PG'
      };
      
      const mockMovies = [
        { id: 3, title: 'Comedy Movie 1', type: 'movie', content_classification: 'PG' },
        { id: 4, title: 'Comedy Movie 2', type: 'movie', content_classification: 'PG' }
      ];
      
      // Mock Media.findAndCountAll
      Media.findAndCountAll.mockResolvedValue({
        count: 25,
        rows: mockMovies
      });
      
      // Call the method
      const result = await mediaService.getMovies(options);
      
      // Assertions
      expect(Media.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          type: 'movie',
          content_classification: 'PG'
        }),
        limit: 10,
        offset: 10 // (page 2 - 1) * limit 10
      }));
      
      expect(result).toEqual({
        movies: mockMovies,
        pagination: expect.objectContaining({
          total: 25,
          page: 2,
          limit: 10
        })
      });
    });

    it('should handle errors', async () => {
      // Mock Media.findAndCountAll to throw an error
      const error = new Error('Database error');
      Media.findAndCountAll.mockRejectedValue(error);
      
      // Mock console.error
      console.error = jest.fn();
      
      // Call the method and expect it to throw
      await expect(mediaService.getMovies()).rejects.toThrow('Database error');
      
      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error getting movies:', error);
    });
  });
});

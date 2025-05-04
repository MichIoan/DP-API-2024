const { MediaGenres } = require('../../mocks/models');

describe('MediaGenres Model', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByPk', () => {
    it('should return a media genre relationship when given a valid ID', async () => {
      const mediaGenre = await MediaGenres.findByPk(1);
      
      expect(MediaGenres.findByPk).toHaveBeenCalledWith(1);
      expect(mediaGenre).toEqual({
        media_genre_id: 1,
        media_id: 1,
        genre_id: 1
      });
    });

    it('should be able to mock a different return value', async () => {
      // Override the mock for this specific test
      MediaGenres.findByPk.mockResolvedValueOnce({
        media_genre_id: 2,
        media_id: 1,
        genre_id: 2
      });
      
      const mediaGenre = await MediaGenres.findByPk(2);
      
      expect(MediaGenres.findByPk).toHaveBeenCalledWith(2);
      expect(mediaGenre.media_id).toBe(1);
      expect(mediaGenre.genre_id).toBe(2);
    });
  });

  describe('findAll', () => {
    it('should return an empty array by default', async () => {
      const mediaGenres = await MediaGenres.findAll();
      
      expect(MediaGenres.findAll).toHaveBeenCalled();
      expect(mediaGenres).toEqual([]);
    });

    it('should be able to mock a list of media genre relationships', async () => {
      // Override the mock for this specific test
      MediaGenres.findAll.mockResolvedValueOnce([
        {
          media_genre_id: 1,
          media_id: 1,
          genre_id: 1
        },
        {
          media_genre_id: 2,
          media_id: 1,
          genre_id: 2
        },
        {
          media_genre_id: 3,
          media_id: 2,
          genre_id: 1
        }
      ]);
      
      const mediaGenres = await MediaGenres.findAll();
      
      expect(MediaGenres.findAll).toHaveBeenCalled();
      expect(mediaGenres).toHaveLength(3);
      expect(mediaGenres[0].media_id).toBe(1);
      expect(mediaGenres[0].genre_id).toBe(1);
      expect(mediaGenres[1].genre_id).toBe(2);
      expect(mediaGenres[2].media_id).toBe(2);
    });
  });

  describe('create', () => {
    it('should call create with the provided media genre data', async () => {
      const mediaGenreData = {
        media_id: 3,
        genre_id: 2
      };
      
      await MediaGenres.create(mediaGenreData);
      
      expect(MediaGenres.create).toHaveBeenCalledWith(mediaGenreData);
    });

    it('should be able to mock a created media genre relationship', async () => {
      const mediaGenreData = {
        media_id: 3,
        genre_id: 2
      };
      
      // Override the mock for this specific test
      MediaGenres.create.mockResolvedValueOnce({
        media_genre_id: 4,
        ...mediaGenreData
      });
      
      const createdMediaGenre = await MediaGenres.create(mediaGenreData);
      
      expect(MediaGenres.create).toHaveBeenCalledWith(mediaGenreData);
      expect(createdMediaGenre.media_genre_id).toBe(4);
      expect(createdMediaGenre.media_id).toBe(3);
      expect(createdMediaGenre.genre_id).toBe(2);
    });
  });

  describe('update', () => {
    it('should call update with the provided media genre data and options', async () => {
      const mediaGenreData = {
        genre_id: 3
      };
      
      const options = {
        where: { media_genre_id: 1 }
      };
      
      await MediaGenres.update(mediaGenreData, options);
      
      expect(MediaGenres.update).toHaveBeenCalledWith(mediaGenreData, options);
    });
  });

  describe('destroy', () => {
    it('should call destroy with the provided options', async () => {
      const options = {
        where: { media_genre_id: 1 }
      };
      
      await MediaGenres.destroy(options);
      
      expect(MediaGenres.destroy).toHaveBeenCalledWith(options);
    });
  });

  describe('toXML', () => {
    it('should format media genre data for XML responses', () => {
      const mediaGenreData = {
        media_genre_id: 1,
        media_id: 1,
        genre_id: 1
      };
      
      const mediaGenre = {
        get: () => mediaGenreData,
        toXML: MediaGenres.prototype.toXML
      };
      
      const xmlData = mediaGenre.toXML();
      
      expect(xmlData).toEqual({
        mediaGenre: {
          id: 1,
          mediaId: 1,
          genreId: 1
        }
      });
    });
    
    it('should handle direct data object without get method', () => {
      const mediaGenre = {
        media_genre_id: 2,
        media_id: 3,
        genre_id: 4,
        toXML: MediaGenres.prototype.toXML
      };
      
      const xmlData = mediaGenre.toXML();
      
      expect(xmlData).toEqual({
        mediaGenre: {
          id: 2,
          mediaId: 3,
          genreId: 4
        }
      });
    });
  });
});

const { Genre } = require('../../mocks/models');

describe('Genre Model', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByPk', () => {
    it('should return a genre when given a valid ID', async () => {
      const genre = await Genre.findByPk(1);
      
      expect(Genre.findByPk).toHaveBeenCalledWith(1);
      expect(genre).toEqual({
        genre_id: 1,
        name: 'Action',
        description: 'Action-packed content with thrilling sequences'
      });
    });

    it('should be able to mock a different return value', async () => {
      // Override the mock for this specific test
      Genre.findByPk.mockResolvedValueOnce({
        genre_id: 2,
        name: 'Comedy',
        description: 'Humorous content designed to make you laugh'
      });
      
      const genre = await Genre.findByPk(2);
      
      expect(Genre.findByPk).toHaveBeenCalledWith(2);
      expect(genre.name).toBe('Comedy');
    });
  });

  describe('findAll', () => {
    it('should return an empty array by default', async () => {
      const genres = await Genre.findAll();
      
      expect(Genre.findAll).toHaveBeenCalled();
      expect(genres).toEqual([]);
    });
    
    it('should be able to mock a list of genres', async () => {
      // Override the mock for this specific test
      Genre.findAll.mockResolvedValueOnce([
        {
          genre_id: 1,
          name: 'Action',
          description: 'Action-packed content with thrilling sequences'
        },
        {
          genre_id: 2,
          name: 'Comedy',
          description: 'Humorous content designed to make you laugh'
        }
      ]);
      
      const genres = await Genre.findAll();
      
      expect(Genre.findAll).toHaveBeenCalled();
      expect(genres.length).toBe(2);
      expect(genres[0].name).toBe('Action');
      expect(genres[1].name).toBe('Comedy');
    });
  });

  describe('create', () => {
    it('should call create with the provided genre data', async () => {
      const genreData = {
        name: 'Sci-Fi',
        description: 'Science fiction content with futuristic themes'
      };
      
      await Genre.create(genreData);
      
      expect(Genre.create).toHaveBeenCalledWith(genreData);
    });
    
    it('should be able to mock a created genre', async () => {
      const genreData = {
        name: 'Horror',
        description: 'Scary content designed to frighten viewers'
      };
      
      Genre.create.mockResolvedValueOnce({
        genre_id: 3,
        ...genreData
      });
      
      const genre = await Genre.create(genreData);
      
      expect(Genre.create).toHaveBeenCalledWith(genreData);
      expect(genre.genre_id).toBe(3);
      expect(genre.name).toBe('Horror');
    });
  });

  describe('update', () => {
    it('should call update with the provided genre data and options', async () => {
      const genreData = {
        name: 'Updated Action',
        description: 'Updated description for action genre'
      };
      const options = { where: { genre_id: 1 } };
      
      await Genre.update(genreData, options);
      
      expect(Genre.update).toHaveBeenCalledWith(genreData, options);
    });
  });

  describe('destroy', () => {
    it('should call destroy with the provided options', async () => {
      const options = { where: { genre_id: 1 } };
      
      await Genre.destroy(options);
      
      expect(Genre.destroy).toHaveBeenCalledWith(options);
    });
  });

  describe('getMediaWithGenre', () => {
    it('should return media associated with the genre', async () => {
      const genre = {
        genre_id: 1,
        name: 'Action',
        description: 'Action-packed content with thrilling sequences',
        getMediaWithGenre: Genre.prototype.getMediaWithGenre
      };
      
      const media = await genre.getMediaWithGenre();
      
      expect(media).toBeInstanceOf(Array);
      expect(media.length).toBe(2);
      expect(media[0].title).toBe('Action Movie 1');
      expect(media[1].title).toBe('Action Movie 2');
    });
  });

  describe('toXML', () => {
    it('should format genre data for XML responses', () => {
      const genreData = {
        genre_id: 1,
        name: 'Action',
        description: 'Action-packed content with thrilling sequences'
      };
      
      const genre = {
        get: () => genreData,
        toXML: Genre.prototype.toXML
      };
      
      const xmlData = genre.toXML();
      
      expect(xmlData).toEqual({
        genre: {
          id: 1,
          name: 'Action',
          description: 'Action-packed content with thrilling sequences'
        }
      });
    });
    
    it('should handle direct data object without get method', () => {
      const genre = {
        genre_id: 2,
        name: 'Comedy',
        description: 'Humorous content designed to make you laugh',
        toXML: Genre.prototype.toXML
      };
      
      const xmlData = genre.toXML();
      
      expect(xmlData).toEqual({
        genre: {
          id: 2,
          name: 'Comedy',
          description: 'Humorous content designed to make you laugh'
        }
      });
    });
  });
});

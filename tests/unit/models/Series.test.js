const { Series } = require('../../mocks/models');
const ContentClassification = require('../../mocks/ContentClassification');

describe('Series Model', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByPk', () => {
    it('should return a series when given a valid ID', async () => {
      const series = await Series.findByPk(1);
      
      expect(Series.findByPk).toHaveBeenCalledWith(1);
      expect(series).toEqual({
        series_id: 1,
        title: 'Test Series',
        description: 'A test series for testing',
        genre: 'Drama',
        release_year: 2023,
        end_year: null,
        seasons: 1,
        rating: 'TV-MA',
        creator: 'Test Creator',
        cast: ['Actor 1', 'Actor 2'],
        poster_url: 'https://example.com/series-poster.jpg',
        trailer_url: 'https://example.com/series-trailer.mp4'
      });
    });

    it('should be able to mock a different return value', async () => {
      // Override the mock for this specific test
      Series.findByPk.mockResolvedValueOnce({
        series_id: 2,
        title: 'Another Series',
        description: 'Another test series',
        genre: 'Comedy',
        release_year: 2022,
        end_year: 2023,
        seasons: 2,
        rating: 'TV-14',
        creator: 'Another Creator',
        cast: ['Actor 3', 'Actor 4'],
        poster_url: 'https://example.com/another-series-poster.jpg',
        trailer_url: 'https://example.com/another-series-trailer.mp4'
      });
      
      const series = await Series.findByPk(2);
      
      expect(Series.findByPk).toHaveBeenCalledWith(2);
      expect(series.title).toBe('Another Series');
      expect(series.genre).toBe('Comedy');
      expect(series.seasons).toBe(2);
    });
  });

  describe('findAll', () => {
    it('should return an empty array by default', async () => {
      const seriesList = await Series.findAll();
      
      expect(Series.findAll).toHaveBeenCalled();
      expect(seriesList).toEqual([]);
    });

    it('should be able to mock a list of series', async () => {
      // Override the mock for this specific test
      Series.findAll.mockResolvedValueOnce([
        {
          series_id: 1,
          title: 'Series 1',
          genre: 'Drama',
          seasons: 3
        },
        {
          series_id: 2,
          title: 'Series 2',
          genre: 'Comedy',
          seasons: 5
        }
      ]);
      
      const seriesList = await Series.findAll();
      
      expect(Series.findAll).toHaveBeenCalled();
      expect(seriesList).toHaveLength(2);
      expect(seriesList[0].title).toBe('Series 1');
      expect(seriesList[1].title).toBe('Series 2');
      expect(seriesList[0].seasons).toBe(3);
      expect(seriesList[1].seasons).toBe(5);
    });
  });

  describe('create', () => {
    it('should call create with the provided series data', async () => {
      const seriesData = {
        title: 'New Series',
        description: 'A new series',
        genre: 'Sci-Fi',
        release_year: 2024,
        seasons: 1
      };
      
      await Series.create(seriesData);
      
      expect(Series.create).toHaveBeenCalledWith(seriesData);
    });

    it('should be able to mock a created series', async () => {
      const seriesData = {
        title: 'New Series',
        genre: 'Sci-Fi',
        seasons: 1
      };
      
      // Override the mock for this specific test
      Series.create.mockResolvedValueOnce({
        series_id: 3,
        ...seriesData,
        created_at: new Date()
      });
      
      const createdSeries = await Series.create(seriesData);
      
      expect(Series.create).toHaveBeenCalledWith(seriesData);
      expect(createdSeries.series_id).toBe(3);
      expect(createdSeries.title).toBe('New Series');
      expect(createdSeries.seasons).toBe(1);
    });
  });

  describe('update', () => {
    it('should call update with the provided series data and options', async () => {
      const seriesData = {
        title: 'Updated Series',
        description: 'An updated series',
        seasons: 2
      };
      
      const options = {
        where: { series_id: 1 }
      };
      
      await Series.update(seriesData, options);
      
      expect(Series.update).toHaveBeenCalledWith(seriesData, options);
    });
  });

  describe('destroy', () => {
    it('should call destroy with the provided options', async () => {
      const options = {
        where: { series_id: 1 }
      };
      
      await Series.destroy(options);
      
      expect(Series.destroy).toHaveBeenCalledWith(options);
    });
  });

  describe('isSuitableForChildren', () => {
    it('should return true if age restriction is 13 or below', () => {
      const series = {
        age_restriction: 13,
        isSuitableForChildren: Series.prototype.isSuitableForChildren
      };
      
      expect(series.isSuitableForChildren()).toBe(true);
    });

    it('should return false if age restriction is above 13', () => {
      const series = {
        age_restriction: 18,
        isSuitableForChildren: Series.prototype.isSuitableForChildren
      };
      
      expect(series.isSuitableForChildren()).toBe(false);
    });
  });

  describe('getContentClassification', () => {
    it('should return G for age restriction 7 or below', () => {
      const series = {
        age_restriction: 7,
        getContentClassification: Series.prototype.getContentClassification
      };
      
      expect(series.getContentClassification()).toBe(ContentClassification.G);
    });

    it('should return PG for age restriction between 8 and 13', () => {
      const series = {
        age_restriction: 10,
        getContentClassification: Series.prototype.getContentClassification
      };
      
      expect(series.getContentClassification()).toBe(ContentClassification.PG);
    });

    it('should return PG13 for age restriction between 14 and 17', () => {
      const series = {
        age_restriction: 15,
        getContentClassification: Series.prototype.getContentClassification
      };
      
      expect(series.getContentClassification()).toBe(ContentClassification.PG13);
    });

    it('should return R for age restriction 18 or above', () => {
      const series = {
        age_restriction: 18,
        getContentClassification: Series.prototype.getContentClassification
      };
      
      expect(series.getContentClassification()).toBe(ContentClassification.R);
    });
  });

  describe('isRunning', () => {
    it('should return true if end_date is not set', () => {
      const series = {
        end_date: null,
        isRunning: Series.prototype.isRunning
      };
      
      expect(series.isRunning()).toBe(true);
    });

    it('should return true if end_date is in the future', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // One year in the future
      
      const series = {
        end_date: futureDate,
        isRunning: Series.prototype.isRunning
      };
      
      expect(series.isRunning()).toBe(true);
    });

    it('should return false if end_date is in the past', () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1); // One year in the past
      
      const series = {
        end_date: pastDate,
        isRunning: Series.prototype.isRunning
      };
      
      expect(series.isRunning()).toBe(false);
    });
  });

  describe('toXML', () => {
    it('should format series data for XML responses', () => {
      const seriesData = {
        series_id: 1,
        title: 'Test Series',
        age_restriction: 16,
        start_date: new Date('2022-01-01'),
        end_date: null,
        description: 'A test series',
        rating: 8.5
      };
      
      const series = {
        get: () => seriesData,
        toXML: Series.prototype.toXML
      };
      
      const xmlData = series.toXML();
      
      expect(xmlData).toEqual({
        series: {
          id: 1,
          title: 'Test Series',
          ageRestriction: 16,
          startDate: seriesData.start_date,
          endDate: null,
          description: 'A test series',
          rating: 8.5
        }
      });
    });
    
    it('should handle direct data object without get method', () => {
      const series = {
        series_id: 2,
        title: 'Another Series',
        age_restriction: 13,
        start_date: new Date('2023-01-01'),
        end_date: new Date('2023-12-31'),
        description: 'Another test series',
        rating: 7.5,
        toXML: Series.prototype.toXML
      };
      
      const xmlData = series.toXML();
      
      expect(xmlData).toEqual({
        series: {
          id: 2,
          title: 'Another Series',
          ageRestriction: 13,
          startDate: series.start_date,
          endDate: series.end_date,
          description: 'Another test series',
          rating: 7.5
        }
      });
    });
  });
});

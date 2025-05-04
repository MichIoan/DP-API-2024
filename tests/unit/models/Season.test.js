const { Season } = require('../../mocks/models');

describe('Season Model', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('findByPk', () => {
    it('should return a season when given a valid ID', async () => {
      const season = await Season.findByPk(1);
      
      expect(Season.findByPk).toHaveBeenCalledWith(1);
      expect(season).toEqual({
        season_id: 1,
        series_id: 1,
        season_number: 1,
        release_date: new Date('2023-01-01'),
        episode_count: 10,
        description: 'First season of the test series'
      });
    });

    it('should be able to mock a different return value', async () => {
      // Override the mock for this specific test
      Season.findByPk.mockResolvedValueOnce({
        season_id: 2,
        series_id: 1,
        season_number: 2,
        release_date: new Date('2024-01-01'),
        episode_count: 8,
        description: 'Second season of the test series'
      });
      
      const season = await Season.findByPk(2);
      
      expect(Season.findByPk).toHaveBeenCalledWith(2);
      expect(season.season_number).toBe(2);
      expect(season.episode_count).toBe(8);
    });
  });

  describe('findAll', () => {
    it('should return an empty array by default', async () => {
      const seasons = await Season.findAll();
      
      expect(Season.findAll).toHaveBeenCalled();
      expect(seasons).toEqual([]);
    });

    it('should be able to mock a list of seasons', async () => {
      // Override the mock for this specific test
      Season.findAll.mockResolvedValueOnce([
        {
          season_id: 1,
          series_id: 1,
          season_number: 1,
          episode_count: 10
        },
        {
          season_id: 2,
          series_id: 1,
          season_number: 2,
          episode_count: 8
        }
      ]);
      
      const seasons = await Season.findAll();
      
      expect(Season.findAll).toHaveBeenCalled();
      expect(seasons).toHaveLength(2);
      expect(seasons[0].season_number).toBe(1);
      expect(seasons[1].season_number).toBe(2);
    });
  });

  describe('create', () => {
    it('should call create with the provided season data', async () => {
      const seasonData = {
        series_id: 1,
        season_number: 3,
        release_date: new Date('2025-01-01'),
        episode_count: 10,
        description: 'Third season of the test series'
      };
      
      await Season.create(seasonData);
      
      expect(Season.create).toHaveBeenCalledWith(seasonData);
    });

    it('should be able to mock a created season', async () => {
      const seasonData = {
        series_id: 1,
        season_number: 3,
        episode_count: 10
      };
      
      // Override the mock for this specific test
      Season.create.mockResolvedValueOnce({
        season_id: 3,
        ...seasonData,
        release_date: new Date('2025-01-01'),
        description: 'Third season of the test series'
      });
      
      const createdSeason = await Season.create(seasonData);
      
      expect(Season.create).toHaveBeenCalledWith(seasonData);
      expect(createdSeason.season_id).toBe(3);
      expect(createdSeason.season_number).toBe(3);
    });
  });

  describe('update', () => {
    it('should call update with the provided season data and options', async () => {
      const seasonData = {
        episode_count: 12,
        description: 'Updated season description'
      };
      
      const options = {
        where: { season_id: 1 }
      };
      
      await Season.update(seasonData, options);
      
      expect(Season.update).toHaveBeenCalledWith(seasonData, options);
    });
  });

  describe('destroy', () => {
    it('should call destroy with the provided options', async () => {
      const options = {
        where: { season_id: 1 }
      };
      
      await Season.destroy(options);
      
      expect(Season.destroy).toHaveBeenCalledWith(options);
    });
  });

  describe('isLatestSeason', () => {
    it('should return true if season_number matches totalSeasons', () => {
      const season = {
        season_number: 3,
        isLatestSeason: Season.prototype.isLatestSeason
      };
      
      expect(season.isLatestSeason(3)).toBe(true);
    });

    it('should return false if season_number does not match totalSeasons', () => {
      const season = {
        season_number: 2,
        isLatestSeason: Season.prototype.isLatestSeason
      };
      
      expect(season.isLatestSeason(3)).toBe(false);
    });
  });

  describe('isRecentlyReleased', () => {
    it('should return true for seasons released within the last 90 days', () => {
      const today = new Date();
      const recentDate = new Date(today);
      recentDate.setDate(today.getDate() - 45); // 45 days ago
      
      const season = {
        release_date: recentDate,
        isRecentlyReleased: Season.prototype.isRecentlyReleased
      };
      
      expect(season.isRecentlyReleased()).toBe(true);
    });

    it('should return false for seasons released more than 90 days ago', () => {
      const today = new Date();
      const oldDate = new Date(today);
      oldDate.setDate(today.getDate() - 100); // 100 days ago
      
      const season = {
        release_date: oldDate,
        isRecentlyReleased: Season.prototype.isRecentlyReleased
      };
      
      expect(season.isRecentlyReleased()).toBe(false);
    });

    it('should return false if release_date is not set', () => {
      const season = {
        release_date: null,
        isRecentlyReleased: Season.prototype.isRecentlyReleased
      };
      
      expect(season.isRecentlyReleased()).toBe(false);
    });
  });

  describe('toXML', () => {
    it('should format season data for XML responses', () => {
      const seasonData = {
        season_id: 1,
        series_id: 1,
        season_number: 1,
        release_date: new Date('2023-01-01'),
        episode_count: 10,
        description: 'First season of the test series'
      };
      
      const season = {
        get: () => seasonData,
        toXML: Season.prototype.toXML
      };
      
      const xmlData = season.toXML();
      
      expect(xmlData).toEqual({
        season: {
          id: 1,
          seriesId: 1,
          seasonNumber: 1,
          releaseDate: seasonData.release_date,
          episodeCount: 10,
          description: 'First season of the test series'
        }
      });
    });
    
    it('should handle direct data object without get method', () => {
      const season = {
        season_id: 2,
        series_id: 1,
        season_number: 2,
        release_date: new Date('2024-01-01'),
        episode_count: 8,
        description: 'Second season of the test series',
        toXML: Season.prototype.toXML
      };
      
      const xmlData = season.toXML();
      
      expect(xmlData).toEqual({
        season: {
          id: 2,
          seriesId: 1,
          seasonNumber: 2,
          releaseDate: season.release_date,
          episodeCount: 8,
          description: 'Second season of the test series'
        }
      });
    });
  });
});
